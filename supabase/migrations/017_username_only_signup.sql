-- =============================================================================
-- 017_username_only_signup.sql
-- Replace email-based sign-up with username-only sign-up. Auth.users still
-- has an email column (Supabase Auth requires it), but the client wraps
-- each username in a synthetic noreply address. Nothing is ever sent.
--
-- Changes:
--   1. admin_signups.username — case-insensitive UNIQUE + format CHECK.
--   2. handle_new_user_bootstrap — drop the email-specific match. Now: the
--      first signup whenever no admin exists yet becomes bootstrap admin.
--      After that, anyone who signs up goes through /admin/grants approval.
-- =============================================================================

-- Case-insensitive uniqueness on username
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'admin_signups_username_lower_uidx'
  ) then
    create unique index admin_signups_username_lower_uidx
      on public.admin_signups (lower(username));
  end if;
end $$;

-- Format check: lowercase only, allowed charset 3–32 chars. Legacy email-
-- shaped usernames are still permitted via the second branch (the existing
-- two admin rows pre-wipe; once you wipe and start over, all rows match the
-- first branch). NOT VALID so existing rows aren't re-checked.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'admin_signups_username_format'
  ) then
    alter table public.admin_signups
      add constraint admin_signups_username_format
      check (
        username = lower(username)
        and (
          username ~ '^[a-z0-9_.-]{3,32}$'
          or position('@' in username) > 0
        )
      ) not valid;
  end if;
end $$;

-- Bootstrap trigger: first signup → admin. Once any admin exists, inert.
-- Replaces the email-specific check in 016 (we can no longer key off
-- bafagihomar260@gmail.com because users sign up with usernames now).
create or replace function public.handle_new_user_bootstrap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_admin_count int;
begin
  select count(*) into existing_admin_count
  from public.admin_grants
  where revoked_at is null;

  if existing_admin_count > 0 then
    return new;
  end if;

  insert into public.admin_grants (user_id, granted_by, notes)
  values (new.id, new.id, 'Bootstrap admin (first signup; trigger now inert)')
  on conflict (user_id) do nothing;

  return new;
end $$;
