import type { CaseStatus, HantaStrain } from "./types";

// =============================================================================
// Shared normalization utilities used across all source fetchers
// =============================================================================

// ---------------------------------------------------------------------------
// Country name → ISO 3166-1 alpha-2 lookup
// ProMED and WHO use full English country names; this maps them.
// ---------------------------------------------------------------------------
const COUNTRY_MAP: Record<string, string> = {
  // Americas
  argentina: "AR",
  bolivia: "BO",
  brazil: "BR",
  brasil: "BR",
  canada: "CA",
  chile: "CL",
  colombia: "CO",
  "costa rica": "CR",
  ecuador: "EC",
  "el salvador": "SV",
  guatemala: "GT",
  honduras: "HN",
  mexico: "MX",
  nicaragua: "NI",
  panama: "PA",
  paraguay: "PY",
  peru: "PE",
  usa: "US",
  "united states": "US",
  "united states of america": "US",
  uruguay: "UY",
  venezuela: "VE",
  // Europe
  austria: "AT",
  belarus: "BY",
  belgium: "BE",
  "bosnia and herzegovina": "BA",
  croatia: "HR",
  "czech republic": "CZ",
  czechia: "CZ",
  denmark: "DK",
  estonia: "EE",
  finland: "FI",
  france: "FR",
  germany: "DE",
  greece: "GR",
  hungary: "HU",
  latvia: "LV",
  lithuania: "LT",
  moldova: "MD",
  netherlands: "NL",
  norway: "NO",
  poland: "PL",
  portugal: "PT",
  romania: "RO",
  russia: "RU",
  "russian federation": "RU",
  serbia: "RS",
  slovakia: "SK",
  slovenia: "SI",
  spain: "ES",
  sweden: "SE",
  switzerland: "CH",
  ukraine: "UA",
  "united kingdom": "GB",
  // Asia-Pacific
  china: "CN",
  "hong kong": "HK",
  indonesia: "ID",
  japan: "JP",
  "south korea": "KR",
  korea: "KR",
  laos: "LA",
  myanmar: "MM",
  "new zealand": "NZ",
  philippines: "PH",
  russia_asia: "RU",
  singapore: "SG",
  thailand: "TH",
  vietnam: "VN",
  // Africa / Middle East
  "democratic republic of the congo": "CD",
  "dr congo": "CD",
  "central african republic": "CF",
};

/** Map a free-text country name to ISO 3166-1 alpha-2. Returns 'ZZ' if unknown. */
export function toISO2(rawCountry: string): string {
  const key = rawCountry.trim().toLowerCase().replace(/[^\w\s]/g, "");
  return COUNTRY_MAP[key] ?? "ZZ";
}

// ---------------------------------------------------------------------------
// Status inference from free text
// ---------------------------------------------------------------------------
const FATAL_TERMS = /\b(fatal|death|died|deceased|mortality|lethal|fatality)\b/i;
const CONFIRMED_TERMS = /\b(confirmed|laboratory.confirmed|lab.confirmed|verified)\b/i;
const SUSPECTED_TERMS = /\b(suspected|suspect|probable|possible|under investigation)\b/i;

export function inferStatus(text: string): CaseStatus {
  if (FATAL_TERMS.test(text)) return "fatal";
  if (CONFIRMED_TERMS.test(text)) return "confirmed";
  if (SUSPECTED_TERMS.test(text)) return "suspected";
  return "suspected"; // conservative default
}

// ---------------------------------------------------------------------------
// Strain inference from free text
// ---------------------------------------------------------------------------
const STRAIN_PATTERNS: Array<[RegExp, HantaStrain]> = [
  [/\b(sin nombre|snv|hps|four corners)\b/i, "sin_nombre"],
  [/\b(andes|andean|andes virus|andv)\b/i, "andes"],
  [/\b(seoul|seov|seoul virus)\b/i, "seoul"],
  [/\b(puumala|puuv|nephropathia)\b/i, "puumala"],
  [/\b(dobrava|dobv|hantaan|htv)\b/i, "other"],
];

export function inferStrain(text: string): HantaStrain | null {
  for (const [pattern, strain] of STRAIN_PATTERNS) {
    if (pattern.test(text)) return strain;
  }
  return null;
}

/** Default strain by country — heuristic for when text gives no explicit strain. */
export function defaultStrainByCountry(iso2: string): HantaStrain | null {
  const ANDES_COUNTRIES = new Set(["AR", "CL", "BO", "PY", "UY"]);
  const SIN_NOMBRE_COUNTRIES = new Set(["US", "CA", "MX"]);
  const PUUMALA_COUNTRIES = new Set(["FI", "SE", "NO", "DK", "EE", "LV", "LT", "DE", "FR", "BE", "NL"]);
  const SEOUL_COUNTRIES = new Set(["CN", "KR", "JP", "TH", "VN", "ID"]);

  if (ANDES_COUNTRIES.has(iso2)) return "andes";
  if (SIN_NOMBRE_COUNTRIES.has(iso2)) return "sin_nombre";
  if (PUUMALA_COUNTRIES.has(iso2)) return "puumala";
  if (SEOUL_COUNTRIES.has(iso2)) return "seoul";
  return null;
}

// ---------------------------------------------------------------------------
// Case count extraction from text
// ---------------------------------------------------------------------------
const CASE_COUNT_PATTERNS = [
  /(\d[\d,]*)\s*(?:confirmed\s+)?(?:new\s+)?(?:additional\s+)?cases?/i,
  /(\d[\d,]*)\s*(?:human\s+)?(?:hantavirus|hps)\s+cases?/i,
  /cases?\s*(?:count|total)?[:\s]+(\d[\d,]*)/i,
  /(\d[\d,]*)\s*(?:deaths?|fatalities)/i,
];

export function extractCaseCount(text: string): number {
  for (const pattern of CASE_COUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const n = parseInt(match[1].replace(/,/g, ""), 10);
      if (!isNaN(n) && n > 0 && n < 100_000) return n;
    }
  }
  return 1; // default: one case if no count found
}

// ---------------------------------------------------------------------------
// Date parsing — handles a few common formats from health sources
// ---------------------------------------------------------------------------
const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, september: 9, oct: 10, october: 10,
  nov: 11, november: 11, dec: 12, december: 12,
};

/** Parse a date string to YYYY-MM-DD. Returns null if unparseable. */
export function parseDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();

  // ISO 8601 — already good
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  // RFC 822 (RSS pubDate): "Mon, 28 Apr 2026 14:15:00 +0000"
  const rfc = s.match(/\w+,\s*(\d+)\s+(\w+)\s+(\d{4})/);
  if (rfc) {
    const day = rfc[1].padStart(2, "0");
    const mon = MONTHS[rfc[2].toLowerCase()];
    if (mon) return `${rfc[3]}-${String(mon).padStart(2, "0")}-${day}`;
  }

  // Long form: "28 April 2026" or "April 28, 2026"
  const long1 = s.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (long1) {
    const mon = MONTHS[long1[2].toLowerCase()];
    if (mon) return `${long1[3]}-${String(mon).padStart(2, "0")}-${long1[1].padStart(2, "0")}`;
  }
  const long2 = s.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (long2) {
    const mon = MONTHS[long2[1].toLowerCase()];
    if (mon) return `${long2[3]}-${String(mon).padStart(2, "0")}-${long2[2].padStart(2, "0")}`;
  }

  // Try native Date as last resort
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);

  return null;
}

// ---------------------------------------------------------------------------
// Text cleaning — strip HTML tags, collapse whitespace, cap length
// ---------------------------------------------------------------------------
export function cleanText(html: string, maxLen = 600): string {
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

// ---------------------------------------------------------------------------
// US state name → abbreviation
// ---------------------------------------------------------------------------
const US_STATE_MAP: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR",
  california: "CA", colorado: "CO", connecticut: "CT", delaware: "DE",
  florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID",
  illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS",
  kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM",
  "new york": "NY", "north carolina": "NC", "north dakota": "ND",
  ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA",
  "rhode island": "RI", "south carolina": "SC", "south dakota": "SD",
  tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV",
  wisconsin: "WI", wyoming: "WY",
};

export function toStateCode(name: string): string {
  const key = name.trim().toLowerCase();
  return US_STATE_MAP[key] ?? name.toUpperCase().slice(0, 2);
}

export function fromStateCode(code: string): string | null {
  const upper = code.toUpperCase();
  const entry = Object.entries(US_STATE_MAP).find(([, v]) => v === upper);
  return entry ? entry[0].replace(/\b\w/g, (c) => c.toUpperCase()) : null;
}
