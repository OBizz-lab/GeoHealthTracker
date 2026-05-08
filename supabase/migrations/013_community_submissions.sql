-- =============================================================================
-- 013_community_submissions.sql
-- Community case submissions: admin A submits → unconfirmed (is_published=false)
-- → admin B approves → counted. The DB enforces no self-approval.
-- =============================================================================

alter table public.cases
  add column if not exists submitted_by uuid references auth.users(id) on delete set null;

create index if not exists cases_submitted_by_idx on public.cases (submitted_by);

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cases' and policyname='cases_admin_insert') then
    create policy "cases_admin_insert" on public.cases
      for insert to authenticated
      with check (true);
  end if;
end $$;

create or replace function public.check_no_self_approve()
returns trigger language plpgsql as $$
begin
  if old.is_published = false and new.is_published = true then
    if new.submitted_by is not null and new.submitted_by = auth.uid() then
      raise exception 'admin cannot approve their own submission (case_id=%, submitted_by=%)', new.id, new.submitted_by
        using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists cases_no_self_approve on public.cases;
create trigger cases_no_self_approve
  before update on public.cases
  for each row execute function public.check_no_self_approve();
