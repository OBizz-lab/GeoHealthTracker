-- =============================================================================
-- 011_cluster_snapshot_cron.sql
-- Schedules the cluster-snapshot edge function every 12h, per
-- HONDIUS_OUTBREAK_DATA.md §5. Minute 7 to avoid colliding with the existing
-- fast-cadence ingest cron (:00/:15/:30/:45).
-- =============================================================================

select cron.schedule(
  'cluster-snapshot-12h',
  '7 */12 * * *',
  $$
  select net.http_post(
    url     := 'https://olmiymxlmygtodhkaiqg.supabase.co/functions/v1/cluster-snapshot',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := '{}'::jsonb
  ) as request_id;
  $$
);
