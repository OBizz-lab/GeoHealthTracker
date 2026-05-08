import { createHash } from "crypto";

/**
 * Compute the deduplification hash for a case.
 *
 * Strategy (from DESIGN_DOC §7.3):
 *  - Preferred: sha256("${sourceSlug}|${externalId}") when the source has a
 *    stable, unique external ID (e.g. RSS guid, URL slug).
 *  - Fallback: sha256 of (country | state | county | date | count) when the
 *    source is a press release or unstructured blob.
 *
 * Callers pick which strategy to use; document the choice in each source spec.
 */

export function dedupeHashFromId(
  sourceSlug: string,
  externalId: string,
): string {
  return sha256(`${sourceSlug}|${externalId}`);
}

export function dedupeHashFromContent(fields: {
  country: string;
  state: string | null;
  county: string | null;
  date: string | null;
  count: number;
}): string {
  const key = [
    fields.country,
    fields.state ?? "",
    fields.county ?? "",
    fields.date ?? "",
    String(fields.count),
  ].join("|");
  return sha256(key);
}

function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}
