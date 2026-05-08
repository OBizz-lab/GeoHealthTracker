// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;
import { geocode } from "./geocode";
import { ALL_SOURCES, getSourcesByCadence } from "./sources/index";
import type {
  CanonicalCase,
  FetchContext,
  PipelineRunResult,
  SourceModule,
  SourceRunResult,
} from "./types";

// =============================================================================
// Ingestion pipeline orchestrator
//
// For each source:
//   1. fetch()        — pull raw items from the external feed/page
//   2. normalize()    — convert each raw item to a CanonicalCase
//   3. geocode()      — fill in lat/lng (via Mapbox, cached in Supabase)
//   4. upsert()       — write to `cases` with dedupe_hash conflict resolution
//   5. mark source    — update ingestion_sources.last_checked_at / last_success_at
//
// All ingested cases land with is_published=false until an admin approves them.
// =============================================================================

// ---------------------------------------------------------------------------
// Geocode a canonical case in-place (mutates location_lat / location_lng)
// ---------------------------------------------------------------------------
async function geocodeCase(
  supabase: SupabaseClient,
  c: CanonicalCase,
): Promise<void> {
  if (c.location_lat !== null && c.location_lng !== null) return; // already set

  // Build query: prefer specific location > country
  const query = c.location_name !== "Unknown" ? c.location_name : c.country;
  if (!query) return;

  try {
    const geo = await geocode(supabase, query, c.country !== "ZZ" ? c.country : undefined);
    if (geo) {
      c.location_lat = geo.lat;
      c.location_lng = geo.lng;
    }
  } catch {
    // Non-fatal: geocoding failure doesn't block ingestion
  }
}

// ---------------------------------------------------------------------------
// Look up the Supabase row IDs needed for the cases insert
// ---------------------------------------------------------------------------
async function resolveIds(
  supabase: SupabaseClient,
  sourceSlug: string,
): Promise<{ diseaseId: string; sourceId: string } | null> {
  const [{ data: disease }, { data: source }] = await Promise.all([
    supabase
      .from("diseases")
      .select("id")
      .eq("slug", "hantavirus")
      .maybeSingle(),
    supabase
      .from("ingestion_sources")
      .select("id")
      .eq("slug", sourceSlug)
      .maybeSingle(),
  ]);

  if (!disease?.id || !source?.id) return null;
  return { diseaseId: disease.id, sourceId: source.id };
}

// ---------------------------------------------------------------------------
// Upsert a single canonical case into Supabase
// Returns 'inserted' | 'updated' | 'skipped'
// ---------------------------------------------------------------------------
async function upsertCase(
  supabase: SupabaseClient,
  c: CanonicalCase,
  diseaseId: string,
  sourceId: string,
): Promise<"inserted" | "updated" | "skipped"> {
  const row = {
    disease_id: diseaseId,
    source_id: sourceId,
    external_id: c.external_id,
    source_url: c.source_url,
    location_lat: c.location_lat,
    location_lng: c.location_lng,
    location_name: c.location_name,
    country: c.country,
    state_province: c.state_province,
    county: c.county,
    case_count: c.case_count,
    status: c.status,
    severity: c.severity,
    strain: c.strain,
    reported_date: c.reported_date,
    onset_date: c.onset_date,
    raw_data: c.raw_data,
    notes: c.notes,
    dedupe_hash: c.dedupe_hash,
    is_published: false,
  };

  // Use upsert on dedupe_hash (unique constraint in DB)
  const { error, status } = await supabase
    .from("cases")
    .upsert(row, {
      onConflict: "dedupe_hash",
      ignoreDuplicates: false, // update existing rows (e.g. case count may change)
    });

  if (error) {
    throw new Error(`Supabase upsert error: ${error.message}`);
  }

  // Supabase returns 200 for update, 201 for insert
  return status === 201 ? "inserted" : "updated";
}

// ---------------------------------------------------------------------------
// Run a single source module
// ---------------------------------------------------------------------------
async function runSource(
  supabase: SupabaseClient,
  module: SourceModule,
  ctx: FetchContext,
): Promise<SourceRunResult> {
  const result: SourceRunResult = {
    slug: module.slug,
    fetched: 0,
    queued: 0,
    skipped: 0,
    errors: [],
  };

  // 1. Fetch
  let fetchResult;
  try {
    fetchResult = await module.fetch(ctx);
  } catch (err) {
    result.errors.push(`fetch: ${String(err)}`);
    return result;
  }

  if (fetchResult.meta.error) {
    result.errors.push(`fetch: ${fetchResult.meta.error}`);
    return result;
  }

  result.fetched = fetchResult.meta.itemCount;

  // 2. Resolve DB IDs
  const ids = await resolveIds(supabase, module.slug);
  if (!ids) {
    result.errors.push(
      `Could not resolve disease/source IDs for slug "${module.slug}" — run migrations first`,
    );
    return result;
  }

  // 3. Normalize + geocode + upsert each raw item
  for (const raw of fetchResult.raw) {
    let canonical: CanonicalCase | null;
    try {
      canonical = module.normalize(raw, ctx.sourceId);
    } catch (err) {
      result.errors.push(`normalize: ${String(err)}`);
      continue;
    }
    if (!canonical) continue;

    // 4. Geocode (fills lat/lng in-place)
    await geocodeCase(supabase, canonical);

    // 5. Upsert
    try {
      const outcome = await upsertCase(supabase, canonical, ids.diseaseId, ids.sourceId);
      if (outcome === "inserted") result.queued++;
      else result.skipped++;
    } catch (err) {
      result.errors.push(`upsert: ${String(err)}`);
    }
  }

  // 6. Mark source last_checked_at (and last_success_at if no errors)
  const now = new Date().toISOString();
  const updatePayload: Record<string, string> = { last_checked_at: now };
  if (result.errors.length === 0) {
    updatePayload.last_success_at = now;
  }

  await supabase
    .from("ingestion_sources")
    .update(updatePayload)
    .eq("slug", module.slug);

  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RunOptions {
  /** Only run these slugs. Defaults to all sources. */
  slugs?: string[];
  /** Only run sources with this cadence. */
  cadence?: "fast" | "hourly" | "daily" | "weekly";
}

/**
 * Run the ingestion pipeline.
 *
 * @param supabase  Service-role Supabase client (from getPipelineClient())
 * @param options   Optional filter: which sources to run
 */
export async function runPipeline(
  supabase: SupabaseClient,
  options: RunOptions = {},
): Promise<PipelineRunResult> {
  const startedAt = new Date();

  // Determine which sources to run
  let sources = options.cadence
    ? getSourcesByCadence(options.cadence)
    : ALL_SOURCES;

  if (options.slugs?.length) {
    sources = sources.filter((s) => options.slugs!.includes(s.slug));
  }

  if (sources.length === 0) {
    console.warn("[pipeline] No sources matched the given options.");
  }

  // Fetch lastSuccessAt for each source from DB (for incremental fetching)
  const slugs = sources.map((s) => s.slug);
  const { data: sourceRows } = await supabase
    .from("ingestion_sources")
    .select("slug, id, last_success_at")
    .in("slug", slugs);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sourceMap = new Map<string, { id: string; lastSuccessAt: Date | null }>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((sourceRows ?? []) as any[]).map((r: any) => [
      r.slug as string,
      { id: r.id as string, lastSuccessAt: r.last_success_at ? new Date(r.last_success_at as string) : null },
    ]),
  );

  // Run sources (sequential to avoid hammering external APIs in parallel)
  const results: SourceRunResult[] = [];
  for (const module of sources) {
    const meta = sourceMap.get(module.slug);
    const ctx: FetchContext = {
      sourceId: meta?.id ?? module.slug,
      lastSuccessAt: meta?.lastSuccessAt ?? null,
    };

    console.log(`[pipeline] Running source: ${module.slug}`);
    const r = await runSource(supabase, module, ctx);
    results.push(r);

    const summary = `  ✓ fetched=${r.fetched} queued=${r.queued} skipped=${r.skipped} errors=${r.errors.length}`;
    console.log(summary);
    if (r.errors.length > 0) {
      r.errors.forEach((e) => console.error(`    ✗ ${e}`));
    }
  }

  const finishedAt = new Date();
  return { startedAt, finishedAt, sources: results };
}
