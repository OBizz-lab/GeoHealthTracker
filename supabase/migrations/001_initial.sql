-- GeoHealthTracker initial schema
-- Run with the Supabase CLI (supabase db push) or paste into the SQL editor.

create extension if not exists "pgcrypto";
create extension if not exists "postgis";

-- ============================================================================
-- profiles: one row per authenticated user, mirrored from auth.users
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  organization text,
  role text not null default 'public' check (role in ('public','researcher','operations','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_self_read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_self_update"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================================================
-- sources: trusted origin organizations for reports
-- ============================================================================
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  url text,
  organization_type text not null check (organization_type in ('government','ngo','academic','media')),
  trust_score smallint not null default 80 check (trust_score between 0 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.sources enable row level security;

create policy "sources_public_read"
  on public.sources for select
  using (is_active);

-- ============================================================================
-- reports: the main geographic data points
-- ============================================================================
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  lat double precision not null,
  lng double precision not null,
  geom geography(point, 4326),
  location_name text not null,
  country text not null,
  state_province text,
  status text not null check (status in ('confirmed','suspected','reported','resolved')),
  severity text not null default 'low' check (severity in ('low','moderate','high','critical')),
  condition text,
  case_count integer not null default 0 check (case_count >= 0),
  notes text,
  source_id uuid references public.sources(id) on delete set null,
  source_name text not null,
  source_url text,
  reported_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_geom_idx on public.reports using gist (geom);
create index if not exists reports_status_idx on public.reports (status);
create index if not exists reports_reported_date_idx on public.reports (reported_date desc);
create index if not exists reports_country_idx on public.reports (country);

alter table public.reports enable row level security;

create policy "reports_public_read"
  on public.reports for select
  using (true);

create policy "reports_admin_write"
  on public.reports for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============================================================================
-- subscriptions: paid plan state, mirrored from Stripe webhook handler
-- ============================================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  tier text not null default 'public' check (tier in ('public','researcher','operations')),
  status text not null default 'active' check (status in ('active','trialing','past_due','canceled','incomplete')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions_self_read"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ============================================================================
-- watch_zones: user-defined geographic alert regions
-- ============================================================================
create table if not exists public.watch_zones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  center_lat double precision not null,
  center_lng double precision not null,
  radius_km integer not null check (radius_km between 1 and 5000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists watch_zones_user_idx on public.watch_zones (user_id);

alter table public.watch_zones enable row level security;

create policy "watch_zones_owner_all"
  on public.watch_zones for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- alert_deliveries: log of dispatched alerts per zone/report
-- ============================================================================
create table if not exists public.alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  watch_zone_id uuid not null references public.watch_zones(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null check (channel in ('email','webhook')),
  delivered_at timestamptz not null default now(),
  status text not null default 'sent' check (status in ('queued','sent','failed')),
  error text
);

create index if not exists alert_deliveries_user_idx on public.alert_deliveries (user_id, delivered_at desc);

alter table public.alert_deliveries enable row level security;

create policy "alert_deliveries_owner_read"
  on public.alert_deliveries for select
  using (auth.uid() = user_id);

-- ============================================================================
-- newsletter_subscribers: email signups from the marketing site
-- ============================================================================
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  confirmed boolean not null default false,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  source text default 'website',
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

create policy "newsletter_admin_read"
  on public.newsletter_subscribers for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============================================================================
-- api_keys: hashed personal access tokens for the public API
-- ============================================================================
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  key_prefix text not null,
  key_hash text not null,
  name text not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists api_keys_hash_idx on public.api_keys (key_hash);
create index if not exists api_keys_user_idx on public.api_keys (user_id);

alter table public.api_keys enable row level security;

create policy "api_keys_owner_all"
  on public.api_keys for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- triggers
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.reports_set_geom()
returns trigger
language plpgsql
as $$
begin
  new.geom = st_setsrid(st_makepoint(new.lng, new.lat), 4326)::geography;
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

drop trigger if exists reports_set_geom_ins on public.reports;
create trigger reports_set_geom_ins
  before insert on public.reports
  for each row execute function public.reports_set_geom();

drop trigger if exists reports_set_geom_upd on public.reports;
create trigger reports_set_geom_upd
  before update of lat, lng on public.reports
  for each row execute function public.reports_set_geom();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

drop trigger if exists watch_zones_set_updated_at on public.watch_zones;
create trigger watch_zones_set_updated_at
  before update on public.watch_zones
  for each row execute function public.set_updated_at();

-- ============================================================================
-- handle_new_user: create a profile row when an auth.users row appears
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
