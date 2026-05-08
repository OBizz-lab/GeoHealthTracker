import type { SourceModule } from "../types";
import { source as promed } from "./promed";
import { source as cdcNndss } from "./cdc-nndss";
import { source as whoDon } from "./who-don";
import { source as nmDoh } from "./state/nm-doh";

// =============================================================================
// Source registry — all ingestion source modules registered here.
//
// The pipeline runner iterates this array; cadence-based filtering is done
// in the GitHub Actions workflow (fast-cadence vs daily cron).
// =============================================================================

export const ALL_SOURCES: SourceModule[] = [
  promed,    // ProMED-mail RSS — global, every 15 min
  cdcNndss,  // CDC NNDSS weekly table — US, daily
  whoDon,    // WHO Disease Outbreak News RSS — global, daily
  nmDoh,     // NM DOH press releases — US-NM, daily
];

/** Look up a source module by its slug. */
export function getSourceBySlug(slug: string): SourceModule | undefined {
  return ALL_SOURCES.find((s) => s.slug === slug);
}

/** Return sources matching a cadence category. */
export function getSourcesByCadence(
  cadence: "fast" | "hourly" | "daily" | "weekly",
): SourceModule[] {
  return ALL_SOURCES.filter((s) => s.cadence === cadence);
}
