-- =============================================================================
-- 012_kind_exposed.sql
-- Allow 'exposed' as a third row kind on `cases`. Used for surveillance-
-- follow-up countries: someone in close contact with a confirmed cluster case
-- has returned home but is NOT themselves a confirmed case. These rows have
-- case_count = 0 / fatality_count = 0 so they don't inflate case totals;
-- they only contribute to the "Active regions" metric and render with a
-- distinct marker on the map.
-- =============================================================================

alter table public.cases drop constraint if exists cases_kind_check;
alter table public.cases
  add constraint cases_kind_check
  check (kind in ('confirmed', 'mention', 'exposed'));
