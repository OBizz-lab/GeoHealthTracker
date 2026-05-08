import { dedupeHashFromId, dedupeHashFromContent } from "../../dedupe";
import {
  cleanText,
  extractCaseCount,
  inferStatus,
  parseDate,
} from "../../normalize";
import type {
  CanonicalCase,
  FetchContext,
  FetchResult,
  RawCase,
  SourceModule,
} from "../../types";

// =============================================================================
// New Mexico Department of Health — Hantavirus press releases
// Page:    https://www.health.nm.gov/
// Search:  https://www.health.nm.gov/news/press-releases/
// Cadence: daily (NM is high-incidence; DOH posts case reports quickly)
// Auth:    None
// Docs:    DESIGN_DOC §8.5
//
// Strategy:
//   1. Fetch the NM DOH news/press-releases page
//   2. Filter <a> links whose text/href suggests hantavirus content
//   3. Fetch each linked page and extract case details
//   4. Dedupe by URL (stable)
// =============================================================================

const NM_DOH_NEWS_URL =
  "https://www.health.nm.gov/news/press-releases/";

/** Terms that identify a page as hantavirus-related. */
const HANTA_TERMS =
  /hantavirus|hantaviral|sin nombre|hps|hantaan/i;

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

/** Extract all anchor href+text pairs from raw HTML. */
function extractLinks(
  html: string,
  baseUrl: string,
): Array<{ href: string; text: string }> {
  const links: Array<{ href: string; text: string }> = [];
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const href = m[1].trim();
    const text = m[2].replace(/<[^>]+>/g, " ").trim();
    // Resolve relative URLs
    try {
      const abs = new URL(href, baseUrl).toString();
      links.push({ href: abs, text });
    } catch {
      // malformed href — skip
    }
  }
  return links;
}

/** Strip HTML and truncate. */
function htmlToText(html: string, maxLen = 1200): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

/** Best-effort date extraction from a press release page. */
function extractDateFromPage(html: string, url: string): string | null {
  // Try structured date fields (common in DOH CMS)
  const dateMeta = html.match(
    /(?:content|datetime)=["'](\d{4}-\d{2}-\d{2}[^"']*)/i,
  );
  if (dateMeta) return parseDate(dateMeta[1]);

  // Try common visible patterns: "May 7, 2026" or "07/07/2026"
  const visibleDate = html.match(
    /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i,
  );
  if (visibleDate) return parseDate(visibleDate[0]);

  // Try URL-embedded date: /2026/05/07/
  const urlDate = url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
  if (urlDate) return `${urlDate[1]}-${urlDate[2]}-${urlDate[3]}`;

  return null;
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------
async function fetchNmDoh(ctx: FetchContext): Promise<FetchResult> {
  const fetchedAt = new Date();

  // Step 1: fetch news index
  let indexHtml: string;
  try {
    const resp = await fetch(NM_DOH_NEWS_URL, {
      headers: {
        "User-Agent":
          "HantaVirusTrack/1.0 (+https://hantavirustrack.org) NM-DOH-fetcher",
        Accept: "text/html",
      },
    });
    if (!resp.ok) {
      return {
        raw: [],
        meta: {
          fetchedAt,
          itemCount: 0,
          error: `HTTP ${resp.status} from NM DOH news page`,
        },
      };
    }
    indexHtml = await resp.text();
  } catch (err) {
    return {
      raw: [],
      meta: { fetchedAt, itemCount: 0, error: String(err) },
    };
  }

  // Step 2: find hantavirus-related links
  const allLinks = extractLinks(indexHtml, NM_DOH_NEWS_URL);
  const hantaLinks = allLinks.filter(
    ({ href, text }) =>
      HANTA_TERMS.test(text) || HANTA_TERMS.test(href),
  );

  if (hantaLinks.length === 0) {
    return { raw: [], meta: { fetchedAt, itemCount: 0 } };
  }

  // Step 3: fetch each article page (limit to 10 most recent to avoid hammering)
  const raw: RawCase[] = [];
  const seen = new Set<string>();

  for (const { href, text } of hantaLinks.slice(0, 10)) {
    if (seen.has(href)) continue;
    seen.add(href);

    try {
      const resp = await fetch(href, {
        headers: {
          "User-Agent":
            "HantaVirusTrack/1.0 (+https://hantavirustrack.org) NM-DOH-fetcher",
          Accept: "text/html",
        },
      });
      if (!resp.ok) continue;
      const articleHtml = await resp.text();

      raw.push({
        url: href,
        linkText: text,
        html: articleHtml,
        fetchedAt: fetchedAt.toISOString(),
      });
    } catch {
      // skip unreachable articles
    }
  }

  return { raw, meta: { fetchedAt, itemCount: raw.length } };
}

// ---------------------------------------------------------------------------
// Normalize
// ---------------------------------------------------------------------------
function normalizeNmDoh(raw: RawCase, _sourceId: string): CanonicalCase | null {
  const item = raw as unknown as {
    url: string;
    linkText: string;
    html: string;
    fetchedAt: string;
  };

  const combined = `${item.linkText} ${htmlToText(item.html, 2000)}`;

  if (!HANTA_TERMS.test(combined)) return null;

  // NM DOH cases are always New Mexico, USA
  const country = "US";
  const stateProvince = "NM";
  const locationName = "New Mexico, USA";

  const status = inferStatus(combined);
  const strain = "sin_nombre" as const; // NM is Sin Nombre territory

  const case_count =
    extractCaseCount(item.linkText) ||
    extractCaseCount(htmlToText(item.html, 500)) ||
    1;

  const reported_date = extractDateFromPage(item.html, item.url);
  const notes = cleanText(item.html, 600) || null;

  const externalId = item.url;
  const dedupe_hash = dedupeHashFromId("nm-doh", externalId);

  return {
    source_slug: "nm-doh",
    external_id: externalId,
    source_url: item.url,
    disease_slug: "hantavirus",
    location_lat: null,
    location_lng: null,
    location_name: locationName,
    country,
    state_province: stateProvince,
    county: null,
    case_count,
    status,
    severity: null,
    strain,
    reported_date,
    onset_date: null,
    raw_data: { url: item.url, linkText: item.linkText },
    notes,
    dedupe_hash,
  };
}

// ---------------------------------------------------------------------------
// Module export
// ---------------------------------------------------------------------------
export const source: SourceModule = {
  slug: "nm-doh",
  name: "New Mexico DOH",
  region: "US-NM",
  cadence: "daily",
  fetch: fetchNmDoh,
  normalize: normalizeNmDoh,
};
