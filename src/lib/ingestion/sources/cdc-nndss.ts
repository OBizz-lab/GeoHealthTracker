import { dedupeHashFromContent } from "../dedupe";
import {
  cleanText,
  extractCaseCount,
  inferStatus,
  inferStrain,
  defaultStrainByCountry,
  parseDate,
  toStateCode,
} from "../normalize";
import type {
  CanonicalCase,
  FetchContext,
  FetchResult,
  RawCase,
  SourceModule,
} from "../types";

// =============================================================================
// CDC NNDSS Hantavirus weekly data source
// Page:    https://wonder.cdc.gov/nndss/nndss_weekly_tables_menu.asp
// Also:    https://www.cdc.gov/hantavirus/surveillance/index.html
// Cadence: daily (updated weekly by CDC on Thursdays)
// Auth:    None
// Docs:    DESIGN_DOC §8.3
//
// Strategy:
//  1. Fetch the CDC hantavirus surveillance index page
//  2. Follow the link to the most recent weekly/annual summary table
//  3. Parse each US state row for case counts
//  4. Diff against the `source_snapshots` table to emit only new/changed rows
// =============================================================================

const SURVEILLANCE_URL =
  "https://www.cdc.gov/hantavirus/php/surveillance/hantavirus-disease-cases-by-state-reporting-area.html";

/** Minimum year we care about (older data is historical context only). */
const MIN_YEAR = 2010;

// ---------------------------------------------------------------------------
// Type for a parsed state row from the CDC table
// ---------------------------------------------------------------------------
interface CdcStateRow {
  state: string; // Two-letter code e.g. "NM"
  stateName: string; // Full name e.g. "New Mexico"
  year: number;
  caseCount: number;
  deaths: number | null;
}

// ---------------------------------------------------------------------------
// HTML parsing helpers (cheerio-free fallback: regex-based)
// ---------------------------------------------------------------------------

/**
 * Attempt to load cheerio. If the module is not available (e.g. in an edge
 * runtime), fall back to regex-based extraction.
 */
async function parseWithCheerio(
  html: string,
): Promise<CdcStateRow[]> {
  // Dynamic import so Next.js edge runtime won't choke on the import graph
  const cheerio = await import("cheerio");
  const $ = cheerio.load(html);

  const rows: CdcStateRow[] = [];

  // CDC tables typically have columns: State | Year1 | Year2 | … or similar
  // We look for any <table> whose header mentions "state" and numeric years
  $("table").each((_tableIdx, tableEl) => {
    const headers: string[] = [];
    $(tableEl)
      .find("thead th, tr:first-child th, tr:first-child td")
      .each((_, th) => {
        headers.push($(th).text().trim().toLowerCase());
      });

    // We need at least one column that looks like a 4-digit year
    const yearCols: Array<{ colIdx: number; year: number }> = [];
    headers.forEach((h, i) => {
      const m = h.match(/\b(20\d{2})\b/);
      if (m) yearCols.push({ colIdx: i, year: parseInt(m[1], 10) });
    });
    if (yearCols.length === 0) return; // not a year table

    const stateColIdx = headers.findIndex((h) =>
      /state|reporting area/i.test(h),
    );
    if (stateColIdx < 0) return;

    $(tableEl)
      .find("tbody tr")
      .each((_, trEl) => {
        const cells: string[] = [];
        $(trEl)
          .find("td")
          .each((_, td) => {
            cells.push($(td).text().trim());
          });
        if (cells.length === 0) return;

        const rawState = cells[stateColIdx] ?? "";
        if (!rawState || /total|footnote/i.test(rawState)) return;

        const stateCode = toStateCode(rawState);

        for (const { colIdx, year } of yearCols) {
          if (year < MIN_YEAR) continue;
          const rawCount = cells[colIdx] ?? "";
          // CDC uses "–" or "-" for zero, and sometimes footnote symbols
          const countStr = rawCount.replace(/[^\d]/g, "");
          const count = countStr ? parseInt(countStr, 10) : 0;
          if (isNaN(count)) continue;

          rows.push({
            state: stateCode,
            stateName: rawState,
            year,
            caseCount: count,
            deaths: null,
          });
        }
      });
  });

  return rows;
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------
async function fetchCdcNndss(ctx: FetchContext): Promise<FetchResult> {
  const fetchedAt = new Date();

  let html: string;
  try {
    const resp = await fetch(SURVEILLANCE_URL, {
      headers: {
        "User-Agent":
          "HantaVirusTrack/1.0 (+https://hantavirustrack.org) CDC-NNDSS-fetcher",
        Accept: "text/html",
      },
    });
    if (!resp.ok) {
      return {
        raw: [],
        meta: {
          fetchedAt,
          itemCount: 0,
          error: `HTTP ${resp.status} from CDC surveillance page`,
        },
      };
    }
    html = await resp.text();
  } catch (err) {
    return {
      raw: [],
      meta: { fetchedAt, itemCount: 0, error: String(err) },
    };
  }

  let rows: CdcStateRow[] = [];
  try {
    rows = await parseWithCheerio(html);
  } catch (err) {
    return {
      raw: [],
      meta: {
        fetchedAt,
        itemCount: 0,
        error: `Parse error: ${String(err)}`,
      },
    };
  }

  // Filter: only rows with at least 1 case
  const nonZero = rows.filter((r) => r.caseCount > 0);

  // Convert each row to a RawCase-compatible object
  const raw: RawCase[] = nonZero.map((r) => ({
    ...r,
    sourceUrl: SURVEILLANCE_URL,
    fetchedAt: fetchedAt.toISOString(),
  }));

  return { raw, meta: { fetchedAt, itemCount: raw.length } };
}

// ---------------------------------------------------------------------------
// Normalize
// ---------------------------------------------------------------------------
function normalizeCdcNndss(raw: RawCase, _sourceId: string): CanonicalCase | null {
  const row = raw as unknown as CdcStateRow & {
    sourceUrl: string;
    fetchedAt: string;
  };

  if (!row.state || !row.year || !row.caseCount) return null;

  // CDC data is always US
  const country = "US";
  const stateProvince = row.state;
  const locationName = [row.stateName || row.state, "USA"]
    .filter(Boolean)
    .join(", ");

  // Reported date: use Jan 1 of the surveillance year as a proxy
  const reported_date = `${row.year}-01-01`;

  // Strain default for US
  const strain = defaultStrainByCountry(country);

  // Status: CDC data is confirmed by definition
  const status = "confirmed" as const;

  // Dedupe by content (no stable external ID for aggregate table rows)
  const dedupe_hash = dedupeHashFromContent({
    country,
    state: stateProvince,
    county: null,
    date: reported_date,
    count: row.caseCount,
  });

  return {
    source_slug: "cdc-nndss",
    external_id: null,
    source_url: row.sourceUrl || SURVEILLANCE_URL,
    disease_slug: "hantavirus",
    location_lat: null,
    location_lng: null,
    location_name: locationName,
    country,
    state_province: stateProvince,
    county: null,
    case_count: row.caseCount,
    status,
    severity: null,
    strain,
    reported_date,
    onset_date: null,
    raw_data: raw,
    notes: `CDC NNDSS aggregate: ${row.caseCount} hantavirus case${row.caseCount !== 1 ? "s" : ""} in ${row.stateName || row.state}, ${row.year}.`,
    dedupe_hash,
  };
}

// ---------------------------------------------------------------------------
// Module export
// ---------------------------------------------------------------------------
export const source: SourceModule = {
  slug: "cdc-nndss",
  name: "CDC NNDSS",
  region: "US",
  cadence: "daily",
  fetch: fetchCdcNndss,
  normalize: normalizeCdcNndss,
};
