-- =============================================================================
-- 002_hantavirus_pipeline.sql
-- Adds the hantavirus ingestion pipeline tables.
-- Coexists with 001_initial.sql (reports/sources tables are kept as-is).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- diseases — one row per tracked disease (seed: hantavirus)
-- ---------------------------------------------------------------------------
create table if not exists public.diseases (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,          -- 'hantavirus'
  display_name text not null,                 -- 'Hantavirus'
  description  text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.diseases enable row level security;

create policy "diseases_public_read" on public.diseases
  for select using (is_active);

insert into public.diseases (slug, display_name, description)
values (
  'hantavirus',
  'Hantavirus',
  'Viral hemorrhagic fever transmitted by infected rodents. '
  || 'New World strains (Sin Nombre, Andes) cause Hantavirus Pulmonary Syndrome (HPS); '
  || 'Old World strains (Seoul, Puumala, Dobrava) cause Hemorrhagic Fever with Renal Syndrome (HFRS).'
)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- ingestion_sources — one row per data-pipeline source
-- ---------------------------------------------------------------------------
create table if not exists public.ingestion_sources (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,        -- 'promed', 'cdc-nndss', 'nm-doh', …
  name            text not null,               -- 'ProMED-mail'
  url             text not null,               -- canonical URL for the feed/page
  source_type     text not null check (source_type in ('rss', 'scrape', 'api')),
  region          text,                        -- 'global', 'US', 'NM', …
  cadence         text not null check (cadence in ('fast', 'hourly', 'daily', 'weekly')),
  last_checked_at timestamptz,
  last_success_at timestamptz,
  last_error      text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

alter table public.ingestion_sources enable row level security;

create policy "ingestion_sources_public_read" on public.ingestion_sources
  for select using (is_active);

-- Seed the sources we implement in Phase 2
insert into public.ingestion_sources (slug, name, url, source_type, region, cadence)
values
  ('promed',     'ProMED-mail',                    'https://promedmail.org/feed/',                              'rss',    'global', 'fast'),
  ('cdc-nndss',  'CDC NNDSS — HPS',                'https://www.cdc.gov/hantavirus/surveillance/',              'scrape', 'US',     'weekly'),
  ('nm-doh',     'New Mexico Department of Health', 'https://www.nmhealth.org/news/',                            'scrape', 'NM',     'fast'),
  ('who-don',    'WHO Disease Outbreak News',       'https://www.who.int/feeds/entity/csr/don/en/rss.xml',      'rss',    'global', 'daily'),
  ('az-dhs',     'Arizona DHS',                    'https://www.azdhs.gov/director/public-information-office/', 'scrape', 'AZ',     'fast'),
  ('ecdc',       'ECDC',                           'https://www.ecdc.europa.eu/en/hantavirus-infection',        'scrape', 'EU',     'daily'),
  ('paho',       'PAHO',                           'https://www.paho.org/en/topics/hantavirus',                 'scrape', 'LATAM',  'daily')
on conflict (slug) do update set
  name            = excluded.name,
  url             = excluded.url,
  source_type     = excluded.source_type,
  region          = excluded.region,
  cadence         = excluded.cadence;

-- ---------------------------------------------------------------------------
-- cases — the main hantavirus case entity
-- ---------------------------------------------------------------------------
create table if not exists public.cases (
  id              uuid primary key default gen_random_uuid(),

  -- provenance
  disease_id      uuid not null references public.diseases(id),
  source_id       uuid references public.ingestion_sources(id) on delete set null,
  external_id     text,                    -- source's own ID (RSS guid, URL slug, …)
  source_url      text,

  -- location
  location_lat    double precision,
  location_lng    double precision,
  location_name   text,                    -- 'Rio Arriba County, NM, USA'
  country         text,                    -- ISO 3166-1 alpha-2
  state_province  text,
  county          text,
  geog            geography(point, 4326),

  -- case data
  case_count      integer not null default 1 check (case_count >= 0),
  status          text not null check (status in ('suspected', 'confirmed', 'fatal')),
  severity        text check (severity in ('mild', 'moderate', 'severe', 'fatal')),
  strain          text check (strain in ('sin_nombre', 'andes', 'seoul', 'puumala', 'other')),
  reported_date   date,
  onset_date      date,

  -- content
  notes           text,
  raw_data        jsonb,                   -- full original payload for audit

  -- moderation — HARD RULE: is_published stays false until human approves
  is_published    boolean not null default false,
  verified_by     text,                    -- moderator identifier
  verified_at     timestamptz,

  -- deduplication
  dedupe_hash     text,                    -- sha-256 hex; unique when not null

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Geospatial index for bbox / radius queries
create index if not exists cases_geog_idx
  on public.cases using gist (geog);

-- Status + publication index (the most common query: published cases for the map)
create index if not exists cases_published_idx
  on public.cases (disease_id, is_published, reported_date desc);

-- Country / region index
create index if not exists cases_country_idx
  on public.cases (country, state_province, reported_date desc);

-- Deduplication unique index (partial — allows null hash during drafts)
create unique index if not exists cases_dedupe_idx
  on public.cases (dedupe_hash)
  where dedupe_hash is not null;

alter table public.cases enable row level security;

-- Public can read published cases
create policy "cases_public_read" on public.cases
  for select using (is_published = true);

-- Service role can do everything (pipeline inserts, moderation updates)
-- RLS is bypassed by service_role key — no explicit policy needed.

-- Auto-update geometry column on insert/update
create or replace function public.cases_set_geom()
returns trigger language plpgsql as $$
begin
  if new.location_lat is not null and new.location_lng is not null then
    new.geog = st_setsrid(
      st_makepoint(new.location_lng, new.location_lat), 4326
    )::geography;
  end if;
  return new;
end;
$$;

drop trigger if exists cases_set_geom_ins on public.cases;
create trigger cases_set_geom_ins
  before insert on public.cases
  for each row execute function public.cases_set_geom();

drop trigger if exists cases_set_geom_upd on public.cases;
create trigger cases_set_geom_upd
  before update of location_lat, location_lng on public.cases
  for each row execute function public.cases_set_geom();

drop trigger if exists cases_set_updated_at on public.cases;
create trigger cases_set_updated_at
  before update on public.cases
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- geocode_cache — persist Mapbox geocoding results to avoid re-fetching
-- ---------------------------------------------------------------------------
create table if not exists public.geocode_cache (
  query_text     text primary key,         -- normalized query string
  lat            double precision not null,
  lng            double precision not null,
  place_name     text not null,            -- Mapbox-returned display name
  country_code   text,
  looked_up_at   timestamptz not null default now()
  -- TTL: never auto-expire; admin purges stale entries manually
);

alter table public.geocode_cache enable row level security;
-- Only accessible via service_role (no public RLS policy needed)

-- ---------------------------------------------------------------------------
-- source_snapshots — diff-tracking for sources that don't have stable IDs
-- (e.g., CDC NNDSS weekly tables: store the last payload to detect changes)
-- ---------------------------------------------------------------------------
create table if not exists public.source_snapshots (
  id              uuid primary key default gen_random_uuid(),
  source_id       uuid not null references public.ingestion_sources(id) on delete cascade,
  snapshot_key    text not null,           -- e.g. 'hps-state-counts-2026-w18'
  payload_hash    text not null,           -- sha-256 of payload JSON
  payload         jsonb not null,          -- the full snapshot
  fetched_at      timestamptz not null default now(),
  unique (source_id, snapshot_key)
);

alter table public.source_snapshots enable row level security;
-- Service role only.

-- ---------------------------------------------------------------------------
-- case_rejections — audit trail for moderation rejections
-- ---------------------------------------------------------------------------
create table if not exists public.case_rejections (
  id              uuid primary key default gen_random_uuid(),
  case_id         uuid not null references public.cases(id) on delete cascade,
  rejected_by     text not null,
  reason          text,
  rejected_at     timestamptz not null default now()
);

alter table public.case_rejections enable row level security;
-- Service role only.
