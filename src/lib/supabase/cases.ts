import type { Report, ReportSeverity, ReportStatus } from "@/lib/types";

// =============================================================================
// Fetch published hantavirus cases from Supabase and convert to Report[].
//
// We deliberately go straight to the PostgREST endpoint with `fetch()` and
// the anon key — instead of through @supabase/supabase-js — because that
// client takes a navigator.locks auth lock on every query, and the lock can
// get poisoned (HMR, a hung auto-refresh fetch, etc.) and never release. A
// raw fetch has no lock and can't deadlock. This data is public anyway
// (RLS policy `cases_public_read` allows anon to read `is_published=true`
// rows), so the bearer is just the anon key — same as what supabase-js
// would have sent.
// =============================================================================

interface DbCase {
  id: string;
  kind: string;
  location_lat: number | null;
  location_lng: number | null;
  location_name: string | null;
  country: string | null;
  state_province: string | null;
  status: string;
  severity: string | null;
  reported_date: string | null;
  source_url: string | null;
  case_count: number;
  fatality_count: number;
  cluster_id: string | null;
  notes: string | null;
  strain: string | null;
  ingestion_sources: { name: string } | null;
}

function mapStatus(raw: string): ReportStatus {
  switch (raw) {
    case "confirmed": return "confirmed";
    case "fatal":     return "fatal";
    case "suspected": return "suspected";
    case "resolved":  return "resolved";
    case "reported":
    default:          return "reported";
  }
}

function mapSeverity(raw: string | null): ReportSeverity {
  switch (raw) {
    case "severe":   return "high";
    case "fatal":    return "critical";
    case "moderate": return "moderate";
    case "mild":
    default:         return "low";
  }
}

function dbCaseToReport(row: DbCase): Report | null {
  // Mention and exposure rows are aggregated to a country centroid for
  // display, so they need a country code. (Confirmed cases without a
  // country still count toward "ZZ" buckets.) Geocoding is no longer
  // required — non-geocoded confirmed cases still feed totals and the
  // country choropleth; they just don't render as individual markers.
  if (row.kind !== "confirmed" && (!row.country || row.country === "ZZ")) return null;

  const kind =
    row.kind === "mention" ? "mention" :
    row.kind === "exposed" ? "exposed" :
    "confirmed";

  return {
    id: row.id,
    kind,
    lat: row.location_lat,
    lng: row.location_lng,
    location_name: row.location_name ?? "Unknown",
    country: row.country ?? "ZZ",
    state_province: row.state_province ?? undefined,
    status: mapStatus(row.status),
    severity: mapSeverity(row.severity),
    reported_date: row.reported_date ?? new Date().toISOString().slice(0, 10),
    source_url: row.source_url ?? undefined,
    source_name: row.ingestion_sources?.name ?? "Unknown Source",
    case_count: row.case_count,
    fatality_count: row.fatality_count ?? 0,
    cluster_id: row.cluster_id ?? undefined,
    notes: row.notes ?? "",
    condition: row.strain ?? undefined,
  };
}

const SELECT_COLS =
  "id,kind,location_lat,location_lng,location_name,country,state_province," +
  "status,severity,reported_date,source_url,case_count,fatality_count," +
  "cluster_id,notes,strain,ingestion_sources(name)";

/**
 * Fetch all published, geocoded hantavirus cases. Returns an empty array
 * on any network or API error (the map / cases list fall back gracefully).
 */
export async function fetchPublishedCases(): Promise<Report[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const params = new URLSearchParams({
    select:        SELECT_COLS,
    is_published:  "eq.true",
    order:         "reported_date.desc",
    limit:         "500",
  });

  const endpoint = `${url}/rest/v1/cases?${params.toString()}`;

  // 15s safety timeout — public REST endpoint, no auth lock at risk, but
  // we still don't want the page stuck on a slow connection.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(endpoint, {
      headers: {
        apikey:        key,
        Authorization: `Bearer ${key}`,
      },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      console.error("[cases] PostgREST fetch failed:", res.status, await res.text().catch(() => ""));
      return [];
    }
    const data = (await res.json()) as DbCase[];
    return data.map(dbCaseToReport).filter((r): r is Report => r !== null);
  } catch (err) {
    console.error("[cases] fetch error:", err);
    return [];
  } finally {
    clearTimeout(timer);
  }
}
