-- =============================================================================
-- 018_audit_log_security_definer.sql
-- Bug fix: the case_audit_log trigger introduced in 009 fires as a BEFORE
-- UPDATE on public.cases, runs in the user's auth context, and tries to
-- INSERT into public.case_audit_log — but case_audit_log has RLS enabled
-- with no INSERT policy ("service role only" per the original comment).
-- Result: every admin approval/rejection from the UI fails with
-- "new row violates row-level security policy for table case_audit_log".
--
-- Standard pattern for audit triggers: SECURITY DEFINER. The function then
-- runs with the privileges of its owner (postgres) and bypasses RLS, so
-- the audit row is written regardless of who triggered the update. The
-- audit log is still write-protected from direct user inserts because
-- nothing else (no policy, no API path) can write to it.
-- =============================================================================

create or replace function public.log_case_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user uuid;
begin
  begin
    acting_user := nullif(current_setting('app.current_user', true), '')::uuid;
  exception when others then
    acting_user := null;
  end;

  -- Fall back to the calling user (auth.uid()) when the pipeline didn't
  -- pre-set app.current_user. This way moderation actions from the UI get
  -- attributed to the moderator that performed them.
  if acting_user is null then
    acting_user := auth.uid();
  end if;

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
