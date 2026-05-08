-- =============================================================================
-- 015_fix_rls_recursion.sql
-- Migration 014 introduced an RLS infinite-recursion bug: cases_admin_read
-- did EXISTS (SELECT FROM admin_grants...), and admin_grants_admin_read also
-- did EXISTS (SELECT FROM admin_grants...). When an authenticated user
-- queried `cases`, Postgres recursively re-entered admin_grants RLS and
-- threw "infinite recursion in policy for relation admin_grants" — the whole
-- SELECT failed, and the client UI showed no data.
--
-- Fix: route every "is the current user an admin?" check through the
-- SECURITY DEFINER function public.is_approved_admin(), which bypasses RLS
-- and breaks the cycle.
-- =============================================================================

drop policy if exists "admin_grants_admin_read"   on public.admin_grants;
drop policy if exists "admin_grants_admin_insert" on public.admin_grants;

create policy "admin_grants_admin_read" on public.admin_grants
  for select to authenticated
  using (public.is_approved_admin());

create policy "admin_grants_admin_insert" on public.admin_grants
  for insert to authenticated
  with check (public.is_approved_admin());

-- A user can always read their OWN grant row (so the sign-in flow can detect
-- admin status without going through is_approved_admin()).
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='admin_grants' and policyname='admin_grants_self_read') then
    create policy "admin_grants_self_read" on public.admin_grants
      for select to authenticated
      using (user_id = auth.uid());
  end if;
end $$;

drop policy if exists "admin_signups_admin_read"   on public.admin_signups;
drop policy if exists "admin_signups_admin_update" on public.admin_signups;

create policy "admin_signups_admin_read" on public.admin_signups
  for select to authenticated
  using (public.is_approved_admin());

create policy "admin_signups_admin_update" on public.admin_signups
  for update to authenticated
  using (public.is_approved_admin())
  with check (public.is_approved_admin());

drop policy if exists "cases_admin_read"   on public.cases;
drop policy if exists "cases_admin_insert" on public.cases;
drop policy if exists "cases_admin_update" on public.cases;
drop policy if exists "cases_admin_delete" on public.cases;

create policy "cases_admin_read" on public.cases
  for select to authenticated
  using (public.is_approved_admin());

create policy "cases_admin_insert" on public.cases
  for insert to authenticated
  with check (public.is_approved_admin());

create policy "cases_admin_update" on public.cases
  for update to authenticated
  using (public.is_approved_admin())
  with check (public.is_approved_admin());

create policy "cases_admin_delete" on public.cases
  for delete to authenticated
  using (public.is_approved_admin());
