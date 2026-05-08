-- =============================================================================
-- 010_cluster_reconciliation.sql
-- Multi-source consensus for cluster counts per CASE_COUNT_METHODOLOGY.md §5.
--
-- Reconciliation policy: SOURCE HIERARCHY, not headcount consensus.
-- WHO outranks CDC/PHAC outranks ECDC/PAHO/Africa CDC. The highest-priority
-- source's most recent snapshot is canonical; lower-priority sources never
-- override even if more recent.
-- =============================================================================

create or replace function public.reconcile_cluster(p_cluster_id text)
returns table (
  canonical_cases       int,
  canonical_fatalities  int,
  source_url            text,
  fetched_at            timestamptz,
  priority              int
)
language sql
stable
as $$
  with ranked as (
    select
      cs.reported_total_cases       as canonical_cases,
      cs.reported_total_fatalities  as canonical_fatalities,
      cs.source_url,
      cs.fetched_at,
      case
        when cs.source_url like 'https://www.who.int/%'         then 1
        when cs.source_url like 'https://www.cdc.gov/%'         then 2
        when cs.source_url like 'https://www.canada.ca/%'       then 2
        when cs.source_url like 'https://www.ecdc.europa.eu/%'  then 3
        when cs.source_url like 'https://www.paho.org/%'        then 3
        when cs.source_url like 'https://africacdc.org/%'       then 3
        else 9
      end as priority,
      row_number() over (
        partition by case
          when cs.source_url like 'https://www.who.int/%'         then 1
          when cs.source_url like 'https://www.cdc.gov/%'         then 2
          when cs.source_url like 'https://www.canada.ca/%'       then 2
          when cs.source_url like 'https://www.ecdc.europa.eu/%'  then 3
          when cs.source_url like 'https://www.paho.org/%'        then 3
          when cs.source_url like 'https://africacdc.org/%'       then 3
          else 9
        end
        order by cs.fetched_at desc
      ) as rn
    from public.cluster_snapshots cs
    where cs.cluster_id = p_cluster_id
      and cs.reported_total_cases is not null
  )
  select canonical_cases, canonical_fatalities, source_url, fetched_at, priority
  from ranked
  where rn = 1
  order by priority asc
  limit 1;
$$;

-- Apply the canonical totals to the cluster's primary row in `cases`.
-- The "primary row" is the one with the highest case_count (the aggregate
-- vessel/origin row in Pattern A — see CASE_COUNT_METHODOLOGY.md §4.2).
-- Other rows in the cluster (geographically specific cases) are left alone.
-- The audit trigger from migration 009 logs every change.
create or replace function public.apply_cluster_canonical(p_cluster_id text)
returns jsonb
language plpgsql
as $$
declare
  v_canonical record;
  v_primary_id uuid;
  v_other_cases int;
  v_other_fatalities int;
  v_target_case_count int;
  v_target_fatality_count int;
  v_old_case_count int;
  v_old_fatality_count int;
begin
  select * into v_canonical from public.reconcile_cluster(p_cluster_id);

  if v_canonical is null or v_canonical.canonical_cases is null then
    return jsonb_build_object(
      'cluster_id', p_cluster_id,
      'applied', false,
      'reason', 'no canonical snapshot available'
    );
  end if;

  select id, case_count, fatality_count
    into v_primary_id, v_old_case_count, v_old_fatality_count
  from public.cases
  where cluster_id = p_cluster_id
  order by case_count desc, reported_date asc, id
  limit 1;

  if v_primary_id is null then
    return jsonb_build_object(
      'cluster_id', p_cluster_id,
      'applied', false,
      'reason', 'no rows exist for this cluster'
    );
  end if;

  select
    coalesce(sum(case_count), 0),
    coalesce(sum(fatality_count), 0)
  into v_other_cases, v_other_fatalities
  from public.cases
  where cluster_id = p_cluster_id
    and id <> v_primary_id;

  v_target_case_count     := greatest(0, v_canonical.canonical_cases      - v_other_cases);
  v_target_fatality_count := greatest(0, v_canonical.canonical_fatalities - v_other_fatalities);

  if v_target_fatality_count > v_target_case_count then
    return jsonb_build_object(
      'cluster_id', p_cluster_id,
      'applied', false,
      'reason', 'canonical fatalities exceed canonical cases for primary row',
      'target_case_count', v_target_case_count,
      'target_fatality_count', v_target_fatality_count
    );
  end if;

  if v_target_case_count = v_old_case_count
     and v_target_fatality_count = v_old_fatality_count then
    return jsonb_build_object(
      'cluster_id', p_cluster_id,
      'applied', false,
      'reason', 'already in sync',
      'canonical_cases', v_canonical.canonical_cases,
      'canonical_fatalities', v_canonical.canonical_fatalities
    );
  end if;

  update public.cases
     set case_count     = v_target_case_count,
         fatality_count = v_target_fatality_count,
         status         = case
                            when v_target_fatality_count > 0 then 'fatal'
                            else status
                          end
   where id = v_primary_id;

  return jsonb_build_object(
    'cluster_id', p_cluster_id,
    'applied', true,
    'primary_row_id', v_primary_id,
    'canonical_cases', v_canonical.canonical_cases,
    'canonical_fatalities', v_canonical.canonical_fatalities,
    'canonical_source', v_canonical.source_url,
    'old_case_count', v_old_case_count,
    'new_case_count', v_target_case_count,
    'old_fatality_count', v_old_fatality_count,
    'new_fatality_count', v_target_fatality_count
  );
end;
$$;
