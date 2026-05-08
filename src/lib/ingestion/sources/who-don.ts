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
// WHO Disease Outbreak News (DON) — OData API
// Endpoint: https://www.who.int/api/news/diseaseoutbreaknews
// Cadence:  daily
// Auth:     None (public OData endpoint)
// Docs:     DESIGN_DOC §8.4
//
// The old WHO RSS feed (/rss-feeds/news-releases-en.xml) was retired.
// WHO now exposes an OData v4 API that supports $filter, $select, $orderby.
// We query it directly for hantavirus-related outbreak news.
// =============================================================================

const WHO_API_BASE =
  "https://www.who.int/api/news/diseaseoutbreaknews";

const WHO_DON_BASE_URL =
  "https://www.who.int/emergencies/disease-outbreak-news/item";

/** Terms that identify a WHO DON item as hantavirus-related. */
const HANTA_TERMS =
  /hantavirus|hantaviral|sin nombre|andes virus|puumala|dobrava|seoul virus|hps|hantaan/i;

// ---------------------------------------------------------------------------
// WHO OData response types
// ---------------------------------------------------------------------------
interface WhoApiItem {
  Id: string;
  Title: string;
  PublicationDateAndTime: string;
  LastModified: string;
  ItemDefaultUrl: string; // e.g. "/2026_05_04-en"
  Overview: string | null;
  Assessment: string | null;
  Summary: string | null;
}

interface WhoApiResponse {
  value: WhoApiItem[];
  "@odata.nextLink"?: string;
}

// ---------------------------------------------------------------------------
// Location extraction from WHO DON title
// WHO patterns:
//   "Hantavirus disease – Panama"
//   "Hantavirus – Republic of Korea"
//   "Hantavirus cluster linked to cruise ship travel, Multi-country"
//   "Hantavirus pulmonary syndrome – United States of America (New Mexico)"
// ---------------------------------------------------------------------------
const WHO_TITLE_COUNTRY_RE =
  /[–\-]\s*(?<country>[^\(\n,]+?)(?:\s*\((?<admin>[^)]+)\))?\s*$/i;

function extractWhoLocation(title: string): {
  country: string;
  admin: string | null;
} {
  const m = title.match(WHO_TITLE_COUNTRY_RE);
  if (!m?.groups) return { country: "", admin: null };

  let country = m.groups.country?.trim() ?? "";
  // Handle "Multi-country" and similar
  if (/multi.?country|multiple\s+countries|global/i.test(country)) {
    country = "";
  }
  return { country, admin: m.groups.admin?.trim() ?? null };
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------
async function fetchWhoDon(ctx: FetchContext): Promise<FetchResult> {
  const fetchedAt = new Date();

  // Build OData filter — hantavirus in title, ordered by publication date desc
  // If we have a lastSuccessAt, add a LastModified filter for incremental fetching
  const filterClauses = ["contains(tolower(Title),'hantavirus')"];
  if (ctx.lastSuccessAt) {
    filterClauses.push(`LastModified gt ${ctx.lastSuccessAt.toISOString()}`);
  }

  const params = new URLSearchParams({
    $filter: filterClauses.join(" or "),
    $select:
      "Id,Title,PublicationDateAndTime,LastModified,ItemDefaultUrl,Overview,Assessment,Summary",
    $orderby: "PublicationDateAndTime desc",
    $top: "50",
  });

  // Also fetch items mentioning other hantavirus terms in case Title field differs
  const url = `${WHO_API_BASE}?${params}`;

  let items: WhoApiItem[] = [];
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "HantaVirusTrack/1.0 (+https://hantavirustrack.org) WHO-DON-fetcher",
        Accept: "application/json",
      },
    });

    if (!resp.ok) {
      return {
        raw: [],
        meta: {
          fetchedAt,
          itemCount: 0,
          error: `HTTP ${resp.status} from WHO DON API`,
        },
      };
    }

    const json = (await resp.json()) as WhoApiResponse;
    items = json.value ?? [];
  } catch (err) {
    return {
      raw: [],
      meta: { fetchedAt, itemCount: 0, error: String(err) },
    };
  }

  // Secondary filter: also check body text for hantavirus terms
  const hantaItems = items.filter((item) => {
    const combined = `${item.Title} ${item.Overview ?? ""} ${item.Summary ?? ""}`;
    return HANTA_TERMS.test(combined);
  });

  return {
    raw: hantaItems as unknown as RawCase[],
    meta: { fetchedAt, itemCount: hantaItems.length },
  };
}

// ---------------------------------------------------------------------------
// Normalize
// ---------------------------------------------------------------------------
function normalizeWhoDon(raw: RawCase, _sourceId: string): CanonicalCase | null {
  const item = raw as unknown as WhoApiItem;
  const title = item.Title ?? "";
  const body = [item.Overview, item.Assessment, item.Summary]
    .filter(Boolean)
    .join(" ");
  const combined = `${title} ${body}`;

  if (!HANTA_TERMS.test(combined)) return null;

  const { country: rawCountry, admin: rawAdmin } = extractWhoLocation(title);

  const country = rawCountry ? toISO2(rawCountry) : "ZZ";
  const stateProvince = rawAdmin ?? null;
  const locationName =
    [stateProvince, rawCountry || (country !== "ZZ" ? country : null)]
      .filter(Boolean)
      .join(", ") || "Unknown";

  const status = inferStatus(combined);
  const strain =
    inferStrain(combined) ?? defaultStrainByCountry(country);

  const case_count = extractCaseCount(body) || extractCaseCount(title) || 1;
  const reported_date = parseDate(item.PublicationDateAndTime);
  const notes = cleanText(body, 600) || null;

  // Source URL: build from ItemDefaultUrl
  const sourceUrl = item.ItemDefaultUrl
    ? `${WHO_DON_BASE_URL}${item.ItemDefaultUrl}`
    : "https://www.who.int/emergencies/disease-outbreak-news";

  const externalId = item.Id || item.ItemDefaultUrl;
  const dedupe_hash = dedupeHashFromId("who-don", externalId);

  return {
    source_slug: "who-don",
    external_id: externalId,
    source_url: sourceUrl,
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
    raw_data: item,
    notes,
    dedupe_hash,
  };
}

// ---------------------------------------------------------------------------
// Module export
// ---------------------------------------------------------------------------
export const source: SourceModule = {
  slug: "who-don",
  name: "WHO Disease Outbreak News",
  region: "global",
  cadence: "daily",
  fetch: fetchWhoDon,
  normalize: normalizeWhoDon,
};
