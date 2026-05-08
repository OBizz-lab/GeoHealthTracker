-- =============================================================================
-- 003_case_count_methodology.sql
-- Implements CASE_COUNT_METHODOLOGY.md §3 — the schema pieces required to
-- count cases and fatalities without double-counting.
--
-- Load-bearing rule (§2 #2): fatality_count is ALWAYS a subset of case_count.
-- Stats queries must NEVER sum case_count + fatality_count.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. cases.fatality_count + CHECK constraint
-- ---------------------------------------------------------------------------
alter table public.cases
  add column if not exists fatality_count int not null default 0;

-- Backfill before adding the CHECK so existing rows are consistent. Rows whose
-- status is already 'fatal' had every person in case_count counted as a death
-- under the previous (overlap-free) seed pattern.
update public.cases
   set fatality_count = case_count
 where status = 'fatal'
   and fatality_count = 0;

-- CHECK guards principle #2 at the DB level. A row cannot record more
-- fatalities than total people.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fatality_lte_case_count'
  ) then
    alter table public.cases
      add constraint fatality_lte_case_count
      check (fatality_count <= case_count);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. cases.cluster_id — group rows that belong to the same outbreak
-- ---------------------------------------------------------------------------
alter table public.cases
  add column if not exists cluster_id text;

create index if not exists cases_cluster_idx
  on public.cases (cluster_id)
  where cluster_id is not null;

-- ---------------------------------------------------------------------------
-- 3. case_audit_log — per-row history of count / status / publish changes
-- ---------------------------------------------------------------------------
create table if not exists public.case_audit_log (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid not null references public.cases(id) on delete cascade,
  changed_by  uuid,                              -- auth.users(id) if available
  changed_at  timestamptz not null default now(),
  field       text not null,                     -- 'case_count' | 'fatality_count' | 'status' | 'is_published'
  old_value   text,
  new_value   text,
  source_url  text,
  reason      text
);

create index if not exists case_audit_log_case_idx
  on public.case_audit_log (case_id, changed_at desc);

alter table public.case_audit_log enable row level security;
-- Service role only by default. (Add a moderator-read policy in a later
-- migration once the admin UI surfaces audit history.)

create or replace function public.log_case_change()
returns trigger language plpgsql as $$
declare
  acting_user uuid;
begin
  -- current_setting returns '' if missing (second arg true). Cast guarded.
  begin
    acting_user := nullif(current_setting('app.current_user', true), '')::uuid;
  exception when others then
    acting_user := null;
  end;

  if old.case_count is distinct from new.case_count then
    insert into public.case_audit_log(case_id, changed_by, field, old_value, new_value, source_url)
    values (new.id, acting_user, 'case_count', old.case_count::text, new.case_count::text, new.source_url);
  end if;

  if old.fatality_count is distinct from new.fatality_count then
    insert into public.case_audit_log(case_id, changed_by, field, old_value, new_value, source_url)
    values (new.id, acting_user, 'fatality_count', old.fatality_count::text, new.fatality_count::text, new.source_url);
  end if;

  if old.status is distinct from new.status then
    insert into public.case_audit_log(case_id, changed_by, field, old_value, new_value, source_url)
    values (new.id, acting_user, 'status', old.status, new.status, new.source_url);
  end if;

  if old.is_published is distinct from new.is_published then
    insert into public.case_audit_log(case_id, changed_by, field, old_value, new_value, source_url)
    values (new.id, acting_user, 'is_published', old.is_published::text, new.is_published::text, new.source_url);
  end if;

  return new;
end $$;

drop trigger if exists cases_audit on public.cases;
create trigger cases_audit
  before update on public.cases
  for each row execute function public.log_case_change();

-- ---------------------------------------------------------------------------
-- 4. cluster_snapshots — point-in-time totals for named clusters (e.g. Hondius).
-- Re-fetch cron writes one row per source fetch; the diff against the most
-- recent row drives the moderator "Updates" queue.
-- ---------------------------------------------------------------------------
create table if not exists public.cluster_snapshots (
  id                         uuid primary key default gen_random_uuid(),
  cluster_id                 text not null,
  source_url                 text not null,
  fetched_at                 timestamptz not null default now(),
  reported_total_cases       int,
  reported_total_fatalities  int,
  reported_lab_confirmed     int,
  reported_breakdown         jsonb,
  payload_hash               text not null,
  notes                      text
);

create index if not exists cluster_snapshots_cluster_idx
  on public.cluster_snapshots (cluster_id, fetched_at desc);

alter table public.cluster_snapshots enable row level security;
-- Service role writes; a public-read policy can be added when the cluster
-- detail page (V1.1) ships.
