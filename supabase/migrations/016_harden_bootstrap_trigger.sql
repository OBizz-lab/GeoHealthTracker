-- =============================================================================
-- 016_harden_bootstrap_trigger.sql
-- Closes the bootstrap-admin attack vector: if Supabase email confirmation
-- were ever disabled, the previous trigger would auto-grant admin to ANY
-- new signup using bafagihomar260@gmail.com. The hardened version only
-- fires when NO active admin exists yet — once any admin is established,
-- the trigger permanently no-ops. Subsequent admins must go through the
-- /admin/grants approval flow.
-- =============================================================================

create or replace function public.handle_new_user_bootstrap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_admin_count int;
begin
  if new.email <> 'bafagihomar260@gmail.com' then
    return new;
  end if;

  select count(*) into existing_admin_count
  from public.admin_grants
  where revoked_at is null;

  if existing_admin_count > 0 then
    return new;
  end if;

  insert into public.admin_grants (user_id, granted_by, notes)
  values (new.id, new.id, 'Bootstrap admin (auto-granted on first signup; trigger now inert)')
  on conflict (user_id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created_bootstrap on auth.users;
create trigger on_auth_user_created_bootstrap
  after insert on auth.users
  for each row execute function public.handle_new_user_bootstrap();
