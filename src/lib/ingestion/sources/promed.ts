import { dedupeHashFromId } from "../dedupe";
import {
  cleanText,
  extractCaseCount,
  inferStatus,
  inferStrain,
  defaultStrainByCountry,
  parseDate,
  toISO2,
} from "../normalize";
import type {
  CanonicalCase,
  FetchContext,
  FetchResult,
  RawCase,
  SourceModule,
} from "../types";

// =============================================================================
// ProMED-mail RSS source
// Feed:    https://promedmail.org/feed/
// Cadence: every 15 minutes (fast-cadence cron)
// Auth:    None
// Docs:    DESIGN_DOC §8.1
// =============================================================================

// ProMED moved to a paid subscription model in April 2025 and retired their
// public RSS feed. Their new site is at www.promedmail.org (Payload CMS).
// We attempt the public promed-posts API; 401/403 is handled gracefully.
const FEED_URL = "https://www.promedmail.org/api/promed-posts";

/** Terms that indicate a ProMED post is about hantavirus. */
const HANTA_TERMS =
  /hantavirus|hantaviral|sin nombre|andes virus|puumala|dobrava|seoul virus|hps|hantaan/i;

// ProMED title format:
//   PRO/AH/EDR> Hantavirus - Chile (LL) Andes virus, fatal
//   PRO/AH> Hantavirus pulmonary syndrome - USA (New Mexico)
const TITLE_RE =
  /PRO\/[^>]+>\s*Hantavirus[^-]*-\s*(?<country>[^\(\n,]+?)(?:\s*\((?<admin>[^)]+)\))?\s*(?<rest>[^]*?)(?:,|\s*$)/i;

// ---------------------------------------------------------------------------
// Minimal RSS/XML parser (no external dependency)
// ---------------------------------------------------------------------------
interface RssItem {
  title: string;
  link: string;
  guid: string;
  pubDate: string;
  description: string;
  categories: string[];
}

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];

  // Extract all <item> blocks
  const itemBlocks = [...xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)];

  for (const [, block] of itemBlocks) {
    const title = extractTag(block, "title");
    const link = extractTag(block, "link") || extractTag(block, "guid");
    const guid = extractTag(block, "guid") || link;
    const pubDate = extractTag(block, "pubDate");
    const description = extractTag(block, "description");

    // categories
    const categories: string[] = [];
    for (const [, cat] of block.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)) {
      categories.push(stripCdata(cat).trim());
    }

    if (title && guid) {
      items.push({ title, link, guid, pubDate, description, categories });
    }
  }

  return items;
}

/** Extract content of a named XML tag (handles CDATA). */
function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? stripCdata(match[1]).trim() : "";
}

function stripCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

// ---------------------------------------------------------------------------
// Payload CMS API types (ProMED new site, April 2025+)
// ---------------------------------------------------------------------------
interface PromedApiDoc {
  id: number;
  title: string;
  slug: string;
  publishedAt: string;
  excerpt: string | null;
  // content is a Lexical rich-text tree — we pull plain text from it
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content?: any;
  categories?: Array<{ id: string | number; title?: string }>;
}

interface PromedApiResponse {
  docs: PromedApiDoc[];
  totalDocs: number;
  hasNextPage: boolean;
  page: number;
}

function promedDocToText(doc: PromedApiDoc): string {
  // Best-effort: extract text nodes from the Lexical content tree
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function walk(node: any): string {
    if (!node) return "";
    if (typeof node.text === "string") return node.text;
    if (Array.isArray(node.children)) return node.children.map(walk).join(" ");
    return "";
  }
  return walk(doc.content?.root ?? {});
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------
async function fetchPromed(ctx: FetchContext): Promise<FetchResult> {
  const fetchedAt = new Date();

  // ProMED Payload CMS API — filter by title containing hantavirus terms.
  // Access may be paywalled; we handle 401/403 gracefully.
  const params = new URLSearchParams({
    limit: "50",
    sort: "-publishedAt",
    "where[title][contains]": "hantavirus",
  });

  let docs: PromedApiDoc[] = [];
  try {
    const resp = await fetch(`${FEED_URL}?${params}`, {
      headers: {
        "User-Agent": "HantaVirusTrack/1.0 (+https://hantavirustrack.org)",
        Accept: "application/json",
      },
    });

    if (resp.status === 401 || resp.status === 403) {
      // Paywall — expected until we have a subscription token
      return {
        raw: [],
        meta: {
          fetchedAt,
          itemCount: 0,
          error: `ProMED requires subscription (HTTP ${resp.status}) — skipping`,
        },
      };
    }

    if (!resp.ok) {
      return {
        raw: [],
        meta: {
          fetchedAt,
          itemCount: 0,
          error: `HTTP ${resp.status} from ProMED API`,
        },
      };
    }

    const json = (await resp.json()) as PromedApiResponse;
    docs = json.docs ?? [];
  } catch (err) {
    return {
      raw: [],
      meta: { fetchedAt, itemCount: 0, error: String(err) },
    };
  }

  // Filter to hantavirus-relevant docs (secondary check on body text)
  const hantaDocs = docs.filter((doc) => {
    const text = `${doc.title} ${doc.excerpt ?? ""} ${promedDocToText(doc)}`;
    return HANTA_TERMS.test(text);
  });

  // Convert to RssItem shape that normalizePromed expects
  const rssItems: RssItem[] = hantaDocs.map((doc) => ({
    title: doc.title,
    link: `https://www.promedmail.org/promed-post/${doc.slug}`,
    guid: `promed-${doc.id}`,
    pubDate: doc.publishedAt,
    description: doc.excerpt ?? promedDocToText(doc).slice(0, 800),
    categories: (doc.categories ?? []).map((c) => c.title ?? String(c.id)),
  }));

  return {
    raw: rssItems as unknown as RawCase[],
    meta: { fetchedAt, itemCount: rssItems.length },
  };
}

// ---------------------------------------------------------------------------
// Normalize
// ---------------------------------------------------------------------------
function normalizePromed(raw: RawCase, sourceId: string): CanonicalCase | null {
  const item = raw as unknown as RssItem;
  const title = item.title ?? "";
  const body = item.description ?? "";
  const combined = `${title} ${body}`;

  // Only process hantavirus posts (guard for any that slipped through)
  if (!HANTA_TERMS.test(combined)) return null;

  // Parse title for country + region
  const match = title.match(TITLE_RE);
  const rawCountry = match?.groups?.country?.trim() ?? "";
  const rawAdmin = match?.groups?.admin?.trim() ?? null;
  const rest = match?.groups?.rest?.trim() ?? "";

  const country = rawCountry ? toISO2(rawCountry) : "ZZ";
  const stateProvince = rawAdmin ?? null;

  const locationName = [
    stateProvince,
    rawCountry || country,
  ]
    .filter(Boolean)
    .join(", ") || "Unknown";

  // Status — title takes precedence, then body
  const status = inferStatus(`${rest} ${title} ${body}`);

  // Strain — title then body, fallback to country default
  const strain =
    inferStrain(`${title} ${body}`) ?? defaultStrainByCountry(country);

  // Case count
  const case_count = extractCaseCount(body) || extractCaseCount(title) || 1;

  // Dates
  const reported_date = parseDate(item.pubDate);

  // Notes — first ~600 chars of body
  const notes = cleanText(body, 600) || null;

  // Dedupe: use guid (stable across updates)
  const externalId = item.guid || item.link;
  const dedupeHash = dedupeHashFromId("promed", externalId);

  return {
    source_slug: "promed",
    external_id: externalId,
    source_url: item.link,
    disease_slug: "hantavirus",
    location_lat: null, // geocoded by pipeline runner
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
    raw_data: item,
    notes,
    dedupe_hash: dedupeHash,
  };
}

// ---------------------------------------------------------------------------
// Module export
// ---------------------------------------------------------------------------
export const source: SourceModule = {
  slug: "promed",
  name: "ProMED-mail",
  region: "global",
  cadence: "fast",
  fetch: fetchPromed,
  normalize: normalizePromed,
};
