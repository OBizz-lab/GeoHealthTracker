// =============================================================================
// Ingestion pipeline — shared TypeScript types
// =============================================================================

/** Hantavirus strains. 'other' covers Dobrava and any unclassified strain. */
export type HantaStrain =
  | "sin_nombre"
  | "andes"
  | "seoul"
  | "puumala"
  | "other";

/** Case publication status. Matches the DB enum. */
export type CaseStatus = "suspected" | "confirmed" | "fatal";

export type CaseSeverity = "mild" | "moderate" | "severe" | "fatal";

/** Source ingestion cadence. */
export type Cadence = "fast" | "hourly" | "daily" | "weekly";

// ---------------------------------------------------------------------------
// Raw case — whatever a source fetcher produces (before normalization)
// ---------------------------------------------------------------------------
export type RawCase = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Canonical case — what every source produces after normalize()
// The pipeline writes this shape into the `cases` table.
// ---------------------------------------------------------------------------
export interface CanonicalCase {
  // Provenance
  source_slug: string; // e.g. 'promed', 'cdc-nndss'
  external_id: string | null; // source-native ID (guid, url-slug, …)
  source_url: string;

  // Disease (V1 always 'hantavirus')
  disease_slug: "hantavirus";

  // Location (geocoded where possible)
  location_lat: number | null;
  location_lng: number | null;
  location_name: string; // 'Rio Arriba County, NM, USA'
  country: string; // ISO 3166-1 alpha-2 ('US', 'AR', …)
  state_province: string | null;
  county: string | null;

  // Case details
  case_count: number;
  status: CaseStatus;
  severity: CaseSeverity | null;
  strain: HantaStrain | null;
  reported_date: string | null; // ISO date 'YYYY-MM-DD'
  onset_date: string | null;

  // Content
  raw_data: unknown; // full original payload kept for audit
  notes: string | null; // ≤600-char plain-text summary

  // Deduplication (computed by dedupe.ts)
  dedupe_hash: string;
}

// ---------------------------------------------------------------------------
// Source module interface — one file per source implements this
// ---------------------------------------------------------------------------
export interface FetchContext {
  /** Source row ID from `ingestion_sources`. */
  sourceId: string;
  /** When the source last ran successfully (for incremental fetching). */
  lastSuccessAt: Date | null;
}

export interface FetchMeta {
  fetchedAt: Date;
  itemCount: number;
  error?: string;
}

export interface FetchResult {
  raw: RawCase[];
  meta: FetchMeta;
}

export interface SourceModule {
  slug: string;
  name: string;
  region: string;
  cadence: Cadence;
  fetch(ctx: FetchContext): Promise<FetchResult>;
  normalize(raw: RawCase, sourceId: string): CanonicalCase | null;
}

// ---------------------------------------------------------------------------
// Pipeline run result
// ---------------------------------------------------------------------------
export interface SourceRunResult {
  slug: string;
  fetched: number;
  queued: number; // rows inserted (is_published=false)
  skipped: number; // dedupe hits — updated, not new
  errors: string[];
}

export interface PipelineRunResult {
  startedAt: Date;
  finishedAt: Date;
  sources: SourceRunResult[];
}
