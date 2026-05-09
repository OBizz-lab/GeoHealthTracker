-- =============================================================================
-- 019_case_rejection_tracking.sql
-- Track rejected community submissions instead of deleting them, so the
-- /admin/list page can show per-admin "accepted / pending / rejected"
-- counts. Adds two columns to cases and an aggregated view that backs the
-- admin-list UI.
--
-- Definitions used by the view:
--   accepted = is_published = true                (some other admin approved it)
--   pending  = is_published = false AND rejected_at IS NULL
--   rejected = rejected_at IS NOT NULL            (always also is_published=false)
-- =============================================================================

alter table public.cases
  add column if not exists rejected_at timestamptz,
  add column if not exists rejected_by uuid references auth.users(id) on delete set null;

create index if not exists cases_rejected_at_idx
  on public.cases (rejected_at)
  where rejected_at is not null;

-- Per-admin submission stats. SECURITY INVOKER so the underlying RLS on
-- admin_grants / cases is enforced — non-admins see nothing.
create or replace view public.admin_list_stats
with (security_invoker = on)
as
select
  g.user_id,
  s.username,
  g.granted_at,
  coalesce(sum(case when c.is_published = true                                           then 1 else 0 end), 0)::int as accepted_count,
  coalesce(sum(case when c.is_published = false and c.rejected_at is null                then 1 else 0 end), 0)::int as pending_count,
  coalesce(sum(case when c.rejected_at is not null                                       then 1 else 0 end), 0)::int as rejected_count
from public.admin_grants g
left join public.admin_signups s on s.user_id = g.user_id
left join public.cases c on c.submitted_by = g.user_id
where g.revoked_at is null
group by g.user_id, s.username, g.granted_at;

grant select on public.admin_list_stats to authenticated;
