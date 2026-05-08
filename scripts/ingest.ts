#!/usr/bin/env tsx
// =============================================================================
// Ingestion pipeline CLI entry point
//
// Usage:
//   npx tsx scripts/ingest.ts                         # run all sources
//   npx tsx scripts/ingest.ts --cadence fast          # fast-cadence only
//   npx tsx scripts/ingest.ts --cadence daily         # daily sources only
//   npx tsx scripts/ingest.ts --slugs promed,who-don  # specific sources
//
// Required env vars:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   MAPBOX_SECRET_TOKEN  (optional — geocoding will be skipped if absent)
// =============================================================================

import { config } from "dotenv";
import { getPipelineClient } from "../src/lib/supabase/pipeline-client";
import { runPipeline, type RunOptions } from "../src/lib/ingestion/pipeline";

// Load .env.local (local dev) and .env (CI)
config({ path: ".env.local" });
config({ path: ".env" });

// ---------------------------------------------------------------------------
// Parse CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);

function getArg(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
}

const cadenceRaw = getArg("--cadence");
const validCadences = ["fast", "hourly", "daily", "weekly"] as const;
type Cadence = (typeof validCadences)[number];

const cadence: Cadence | undefined = validCadences.includes(
  cadenceRaw as Cadence,
)
  ? (cadenceRaw as Cadence)
  : undefined;

const slugsRaw = getArg("--slugs");
const slugs = slugsRaw ? slugsRaw.split(",").map((s) => s.trim()) : undefined;

const dryRun = args.includes("--dry-run");

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("HantaVirusTrack — Ingestion Pipeline");
  console.log(`Started: ${new Date().toISOString()}`);
  if (cadence) console.log(`Cadence filter: ${cadence}`);
  if (slugs) console.log(`Source filter:  ${slugs.join(", ")}`);
  if (dryRun) console.log("⚠️  DRY RUN — no writes to Supabase");
  console.log("=".repeat(60));

  const supabase = getPipelineClient();

  const options: RunOptions = { cadence, slugs };

  const result = await runPipeline(supabase, options);

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  const elapsed = result.finishedAt.getTime() - result.startedAt.getTime();
  console.log("\n" + "=".repeat(60));
  console.log(`Finished in ${(elapsed / 1000).toFixed(1)}s`);
  console.log("=".repeat(60));

  let totalFetched = 0;
  let totalQueued = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const s of result.sources) {
    totalFetched += s.fetched;
    totalQueued += s.queued;
    totalSkipped += s.skipped;
    totalErrors += s.errors.length;
    const status = s.errors.length > 0 ? "⚠️ " : "✅";
    console.log(
      `${status} ${s.slug.padEnd(16)} fetched=${s.fetched} queued=${s.queued} skipped=${s.skipped} errors=${s.errors.length}`,
    );
  }

  console.log("-".repeat(60));
  console.log(
    `TOTAL               fetched=${totalFetched} queued=${totalQueued} skipped=${totalSkipped} errors=${totalErrors}`,
  );

  if (totalErrors > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[ingest] Fatal error:", err);
  process.exit(1);
});
