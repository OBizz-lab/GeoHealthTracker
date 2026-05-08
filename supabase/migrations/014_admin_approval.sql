-- =============================================================================
-- 014_admin_approval.sql
-- Admin account approval flow:
--   1. Anyone can sign up (provides username + contribution statement + password)
--   2. They land in `admin_signups` with status='pending'
--   3. An approved admin reviews + approves → row added to `admin_grants`
--   4. Bootstrap admin (bafagihomar260@gmail.com) is auto-granted on first signup
--   5. RLS now requires admin_grants membership for case insert/update
-- =============================================================================

create table if not exists public.admin_grants (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  granted_by  uuid references auth.users(id) on delete set null,
  granted_at  timestamptz not null default now(),
  revoked_at  timestamptz,
  notes       text
);

alter table public.admin_grants enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='admin_grants' and policyname='admin_grants_admin_read') then
    create policy "admin_grants_admin_read" on public.admin_grants
      for select to authenticated
      using (exists (
        select 1 from public.admin_grants g
        where g.user_id = auth.uid() and g.revoked_at is null
      ));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='admin_grants' and policyname='admin_grants_admin_insert') then
    create policy "admin_grants_admin_insert" on public.admin_grants
      for insert to authenticated
      with check (exists (
        select 1 from public.admin_grants g
        where g.user_id = auth.uid() and g.revoked_at is null
      ));
  end if;
end $$;

create table if not exists public.admin_signups (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  username                 text not null,
  contribution_statement   text not null,
  status                   text not null default 'pending'
                           check (status in ('pending', 'approved', 'rejected')),
  reviewed_by              uuid references auth.users(id) on delete set null,
  reviewed_at              timestamptz,
  reviewer_note            text,
  created_at               timestamptz not null default now(),
  unique (user_id)
);

create index if not exists admin_signups_status_idx
  on public.admin_signups (status, created_at desc);

alter table public.admin_signups enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='admin_signups' and policyname='admin_signups_self_insert') then
    create policy "admin_signups_self_insert" on public.admin_signups
      for insert to authenticated
      with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='admin_signups' and policyname='admin_signups_self_read') then
    create policy "admin_signups_self_read" on public.admin_signups
      for select to authenticated
      using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='admin_signups' and policyname='admin_signups_admin_read') then
    create policy "admin_signups_admin_read" on public.admin_signups
      for select to authenticated
      using (exists (
        select 1 from public.admin_grants g
        where g.user_id = auth.uid() and g.revoked_at is null
      ));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='admin_signups' and policyname='admin_signups_admin_update') then
    create policy "admin_signups_admin_update" on public.admin_signups
      for update to authenticated
      using (exists (
        select 1 from public.admin_grants g
        where g.user_id = auth.uid() and g.revoked_at is null
      ));
  end if;
end $$;

create or replace function public.handle_new_user_bootstrap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email = 'bafagihomar260@gmail.com' then
    insert into public.admin_grants (user_id, granted_by, notes)
    values (new.id, new.id, 'Bootstrap admin (auto-granted on signup)')
    on conflict (user_id) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created_bootstrap on auth.users;
create trigger on_auth_user_created_bootstrap
  after insert on auth.users
  for each row execute function public.handle_new_user_bootstrap();

drop policy if exists "cases_admin_insert" on public.cases;
drop policy if exists "cases_admin_update" on public.cases;
drop policy if exists "cases_admin_read"   on public.cases;
drop policy if exists "cases_admin_delete" on public.cases;

create policy "cases_admin_read" on public.cases
  for select to authenticated
  using (exists (
    select 1 from public.admin_grants g
    where g.user_id = auth.uid() and g.revoked_at is null
  ));

create policy "cases_admin_insert" on public.cases
  for insert to authenticated
  with check (exists (
    select 1 from public.admin_grants g
    where g.user_id = auth.uid() and g.revoked_at is null
  ));

create policy "cases_admin_update" on public.cases
  for update to authenticated
  using (exists (
    select 1 from public.admin_grants g
    where g.user_id = auth.uid() and g.revoked_at is null
  ))
  with check (exists (
    select 1 from public.admin_grants g
    where g.user_id = auth.uid() and g.revoked_at is null
  ));

create policy "cases_admin_delete" on public.cases
  for delete to authenticated
  using (exists (
    select 1 from public.admin_grants g
    where g.user_id = auth.uid() and g.revoked_at is null
  ));

create or replace function public.is_approved_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_grants g
    where g.user_id = auth.uid() and g.revoked_at is null
  );
$$;

grant execute on function public.is_approved_admin() to authenticated;
