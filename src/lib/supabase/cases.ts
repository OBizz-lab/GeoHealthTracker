import type { Report, ReportSeverity, ReportStatus } from "@/lib/types";
import { getSupabaseClient } from "./client";

// =============================================================================
// Fetch published hantavirus cases from Supabase and convert to Report[]
// =============================================================================

interface DbCase {
  id: string;
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
  // Skip ungeocoded rows — they can't be placed on the map
  if (row.location_lat == null || row.location_lng == null) return null;

  return {
    id: row.id,
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
    notes: row.notes ?? "",
    condition: row.strain ?? undefined,
  };
}

/**
 * Fetch all published, geocoded hantavirus cases from Supabase.
 * Returns an empty array on error (map falls back gracefully).
 */
export async function fetchPublishedCases(): Promise<Report[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cases")
    .select(`
      id,
      location_lat,
      location_lng,
      location_name,
      country,
      state_province,
      status,
      severity,
      reported_date,
      source_url,
      case_count,
      notes,
      strain,
      ingestion_sources ( name )
    `)
    .eq("is_published", true)
    .not("location_lat", "is", null)
    .order("reported_date", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[cases] Supabase fetch error:", error.message);
    return [];
  }

  return (data as DbCase[])
    .map(dbCaseToReport)
    .filter((r): r is Report => r !== null);
}
