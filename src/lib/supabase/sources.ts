import { getSupabaseClient } from "./client";

// =============================================================================
// fetchSourcesHealth — public read of `ingestion_sources` health metadata.
// Computes a green/yellow/red status from `last_success_at` vs `cadence`.
// =============================================================================

export interface SourceHealth {
  slug:        string;
  name:        string;
  region:      string | null;
  cadence:     string | null;
  lastSuccess: string;
  status:      "green" | "yellow" | "red";
}

interface DbSource {
  slug:              string;
  name:              string;
  region:            string | null;
  cadence:           string | null;
  last_success_at:   string | null;
  last_checked_at:   string | null;
  is_active:         boolean | null;
}

const CADENCE_MS: Record<string, number> = {
  hourly:    60 * 60 * 1000,
  daily:     24 * 60 * 60 * 1000,
  weekly:     7 * 24 * 60 * 60 * 1000,
  fast:      15 * 60 * 1000,
  // legacy / synthetic
  "every-15min": 15 * 60 * 1000,
};

function relativeAgo(iso: string | null): string {
  if (!iso) return "never";
  try {
    const diff  = Date.now() - new Date(iso).getTime();
    if (diff < 60_000)        return "just now";
    if (diff < 3_600_000)     return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000)    return `${Math.floor(diff / 3_600_000)}h ago`;
    return `${Math.floor(diff / 86_400_000)}d ago`;
  } catch {
    return iso;
  }
}

function statusFor(lastSuccess: string | null, cadence: string | null): "green" | "yellow" | "red" {
  if (!lastSuccess) return "red";
  const cadMs: number =
    (cadence ? CADENCE_MS[cadence.toLowerCase()] : undefined) ?? 24 * 60 * 60 * 1000;
  const age   = Date.now() - new Date(lastSuccess).getTime();
  if (age <= cadMs * 2) return "green";
  if (age <= cadMs * 5) return "yellow";
  return "red";
}

export async function fetchSourcesHealth(): Promise<SourceHealth[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("ingestion_sources")
    .select("slug, name, region, cadence, last_success_at, last_checked_at, is_active")
    .order("name", { ascending: true });

  if (error || !data) return [];

  return (data as unknown as DbSource[]).map((s) => ({
    slug:        s.slug,
    name:        s.name,
    region:      s.region,
    cadence:     s.cadence,
    lastSuccess: relativeAgo(s.last_success_at),
    status:      statusFor(s.last_success_at, s.cadence),
  }));
}
