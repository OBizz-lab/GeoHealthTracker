import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "node:crypto";

// =============================================================================
// HantaVirusTrack — Ingestion Edge Function
// POST /functions/v1/ingest
// Body: { cadence?: "fast" | "daily" | "all", slugs?: string[] }
//
// Called by pg_cron every 15 min (fast) and daily at 08:00 UTC.
// Uses Supabase service_role key (auto-injected by runtime) for DB writes.
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type HantaStrain = "sin_nombre" | "andes" | "seoul" | "puumala" | "other";
type CaseStatus = "suspected" | "confirmed" | "fatal";

interface CanonicalCase {
  source_slug: string;
  external_id: string | null;
  source_url: string;
  disease_slug: "hantavirus";
  location_lat: number | null;
  location_lng: number | null;
  location_name: string;
  country: string;
  state_province: string | null;
  county: string | null;
  case_count: number;
  status: CaseStatus;
  severity: null;
  strain: HantaStrain | null;
  reported_date: string | null;
  onset_date: null;
  raw_data: unknown;
  notes: string | null;
  dedupe_hash: string;
}

interface SourceResult {
  slug: string;
  fetched: number;
  queued: number;
  skipped: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Dedupe (uses node:crypto — supported in Deno via node: prefix)
// ---------------------------------------------------------------------------
function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

function dedupeHashFromId(slug: string, id: string): string {
  return sha256(`${slug}|${id}`);
}

// ---------------------------------------------------------------------------
// Normalization utilities
// ---------------------------------------------------------------------------
const COUNTRY_MAP: Record<string, string> = {
  argentina: "AR", bolivia: "BO", brazil: "BR", brasil: "BR", canada: "CA",
  chile: "CL", colombia: "CO", "costa rica": "CR", ecuador: "EC",
  "el salvador": "SV", guatemala: "GT", honduras: "HN", mexico: "MX",
  nicaragua: "NI", panama: "PA", paraguay: "PY", peru: "PE",
  usa: "US", "united states": "US", "united states of america": "US",
  uruguay: "UY", venezuela: "VE", austria: "AT", belarus: "BY",
  belgium: "BE", "bosnia and herzegovina": "BA", croatia: "HR",
  "czech republic": "CZ", czechia: "CZ", denmark: "DK", estonia: "EE",
  finland: "FI", france: "FR", germany: "DE", greece: "GR", hungary: "HU",
  latvia: "LV", lithuania: "LT", moldova: "MD", netherlands: "NL",
  norway: "NO", poland: "PL", portugal: "PT", romania: "RO",
  russia: "RU", "russian federation": "RU", serbia: "RS", slovakia: "SK",
  slovenia: "SI", spain: "ES", sweden: "SE", switzerland: "CH",
  ukraine: "UA", "united kingdom": "GB", china: "CN", "hong kong": "HK",
  indonesia: "ID", japan: "JP", "south korea": "KR", korea: "KR",
  laos: "LA", myanmar: "MM", "new zealand": "NZ", philippines: "PH",
  singapore: "SG", thailand: "TH", vietnam: "VN",
  "democratic republic of the congo": "CD", "dr congo": "CD",
  "central african republic": "CF",
};

function toISO2(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/[^\w\s]/g, "");
  return COUNTRY_MAP[key] ?? "ZZ";
}

const FATAL_RE = /\b(fatal|death|died|deceased|mortality|lethal|fatality)\b/i;
const CONFIRMED_RE = /\b(confirmed|laboratory.confirmed|lab.confirmed|verified)\b/i;

function inferStatus(text: string): CaseStatus {
  if (FATAL_RE.test(text)) return "fatal";
  if (CONFIRMED_RE.test(text)) return "confirmed";
  return "suspected";
}

const STRAIN_PATTERNS: Array<[RegExp, HantaStrain]> = [
  [/\b(sin nombre|snv|hps|four corners)\b/i, "sin_nombre"],
  [/\b(andes|andean|andes virus|andv)\b/i, "andes"],
  [/\b(seoul|seov|seoul virus)\b/i, "seoul"],
  [/\b(puumala|puuv|nephropathia)\b/i, "puumala"],
  [/\b(dobrava|dobv|hantaan|htv)\b/i, "other"],
];

function inferStrain(text: string): HantaStrain | null {
  for (const [pat, strain] of STRAIN_PATTERNS) {
    if (pat.test(text)) return strain;
  }
  return null;
}

function defaultStrainByCountry(iso2: string): HantaStrain | null {
  if (new Set(["AR", "CL", "BO", "PY", "UY"]).has(iso2)) return "andes";
  if (new Set(["US", "CA", "MX"]).has(iso2)) return "sin_nombre";
  if (new Set(["FI", "SE", "NO", "DK", "EE", "LV", "LT", "DE", "FR", "BE", "NL"]).has(iso2)) return "puumala";
  if (new Set(["CN", "KR", "JP", "TH", "VN", "ID"]).has(iso2)) return "seoul";
  return null;
}

const CASE_COUNT_RES = [
  /(\d[\d,]*)\s*(?:confirmed\s+)?(?:new\s+)?(?:additional\s+)?cases?/i,
  /(\d[\d,]*)\s*(?:human\s+)?(?:hantavirus|hps)\s+cases?/i,
  /cases?\s*(?:count|total)?[:\s]+(\d[\d,]*)/i,
  /(\d[\d,]*)\s*(?:deaths?|fatalities)/i,
];

function extractCaseCount(text: string): number {
  for (const re of CASE_COUNT_RES) {
    const m = text.match(re);
    if (m) {
      const n = parseInt(m[1].replace(/,/g, ""), 10);
      if (!isNaN(n) && n > 0 && n < 100_000) return n;
    }
  }
  return 0;
}

function parseDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function cleanText(html: string, maxLen = 600): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim().slice(0, maxLen);
}

// ---------------------------------------------------------------------------
// Source: WHO Disease Outbreak News (OData API)
// ---------------------------------------------------------------------------
const HANTA_RE = /hantavirus|hantaviral|sin nombre|andes virus|puumala|dobrava|seoul virus|hps|hantaan/i;
const WHO_API = "https://www.who.int/api/news/diseaseoutbreaknews";
const WHO_ITEM_BASE = "https://www.who.int/emergencies/disease-outbreak-news/item";
const WHO_COUNTRY_RE = /[–\-]\s*(?<country>[^\(\n,]+?)(?:\s*\((?<admin>[^)]+)\))?\s*$/i;

interface WhoItem {
  Id: string;
  Title: string;
  PublicationDateAndTime: string;
  ItemDefaultUrl: string;
  Overview: string | null;
  Assessment: string | null;
  Summary: string | null;
}

function extractWhoLocation(title: string): { country: string; admin: string | null } {
  const m = title.match(WHO_COUNTRY_RE);
  if (!m?.groups) return { country: "", admin: null };
  let country = m.groups.country?.trim() ?? "";
  if (/multi.?country|multiple\s+countries|global/i.test(country)) country = "";
  return { country, admin: m.groups.admin?.trim() ?? null };
}

// Hard floor for ingestion — only entries from the past 60 days. Older
// archived items are intentionally ignored (DESIGN: current outbreak only).
const INGESTION_WINDOW_DAYS = 60;

async function fetchWhoDon(): Promise<{ cases: CanonicalCase[]; error?: string }> {
  const windowFloor = new Date(Date.now() - INGESTION_WINDOW_DAYS * 86_400_000);

  const params = new URLSearchParams({
    $filter:
      "contains(tolower(Title),'hantavirus') and " +
      `PublicationDateAndTime gt ${windowFloor.toISOString()}`,
    $select: "Id,Title,PublicationDateAndTime,ItemDefaultUrl,Overview,Assessment,Summary",
    $orderby: "PublicationDateAndTime desc",
    $top: "50",
  });

  let resp: Response;
  try {
    resp = await fetch(`${WHO_API}?${params}`, {
      headers: { "User-Agent": "HantaVirusTrack/1.0 (+https://hantavirustrack.org)", Accept: "application/json" },
    });
  } catch (e) {
    return { cases: [], error: String(e) };
  }

  if (!resp.ok) return { cases: [], error: `HTTP ${resp.status} from WHO DON API` };

  const json = await resp.json() as { value: WhoItem[] };
  const items = (json.value ?? []).filter((item) => {
    if (!HANTA_RE.test(`${item.Title} ${item.Overview ?? ""} ${item.Summary ?? ""}`)) return false;
    try { return new Date(item.PublicationDateAndTime) >= windowFloor; }
    catch { return false; }
  });

  const cases: CanonicalCase[] = items.map((item) => {
    const title = item.Title ?? "";
    const body = [item.Overview, item.Assessment, item.Summary].filter(Boolean).join(" ");
    const combined = `${title} ${body}`;
    const { country: rawCountry, admin: rawAdmin } = extractWhoLocation(title);
    const country = rawCountry ? toISO2(rawCountry) : "ZZ";
    const stateProvince = rawAdmin ?? null;
    const locationName =
      [stateProvince, rawCountry || (country !== "ZZ" ? country : null)].filter(Boolean).join(", ") || "Unknown";

    return {
      source_slug: "who-don",
      external_id: item.Id || item.ItemDefaultUrl,
      source_url: item.ItemDefaultUrl
        ? `${WHO_ITEM_BASE}${item.ItemDefaultUrl}`
        : "https://www.who.int/emergencies/disease-outbreak-news",
      disease_slug: "hantavirus",
      location_lat: null, location_lng: null,
      location_name: locationName,
      country, state_province: stateProvince, county: null,
      case_count: extractCaseCount(body) || extractCaseCount(title) || 1,
      status: inferStatus(combined),
      severity: null,
      strain: inferStrain(combined) ?? defaultStrainByCountry(country),
      reported_date: parseDate(item.PublicationDateAndTime),
      onset_date: null,
      raw_data: item,
      notes: cleanText(body, 600) || null,
      dedupe_hash: dedupeHashFromId("who-don", item.Id || item.ItemDefaultUrl),
    };
  });

  return { cases };
}

// ---------------------------------------------------------------------------
// Source: ProMED (Payload CMS API — gracefully handles paywall)
// ---------------------------------------------------------------------------
const PROMED_API = "https://www.promedmail.org/api/promed-posts";
const PROMED_TITLE_RE =
  /PRO\/[^>]+>\s*Hantavirus[^-]*-\s*(?<country>[^\(\n,]+?)(?:\s*\((?<admin>[^)]+)\))?\s*(?<rest>[^]*?)(?:,|\s*$)/i;

interface PromedDoc {
  id: number;
  title: string;
  slug: string;
  publishedAt: string;
  excerpt: string | null;
}

async function fetchPromed(): Promise<{ cases: CanonicalCase[]; error?: string }> {
  const params = new URLSearchParams({
    limit: "50",
    sort: "-publishedAt",
    "where[title][contains]": "hantavirus",
  });

  let resp: Response;
  try {
    resp = await fetch(`${PROMED_API}?${params}`, {
      headers: { "User-Agent": "HantaVirusTrack/1.0 (+https://hantavirustrack.org)", Accept: "application/json" },
    });
  } catch (e) {
    return { cases: [], error: String(e) };
  }

  if (resp.status === 401 || resp.status === 403) {
    return { cases: [], error: `ProMED requires subscription (HTTP ${resp.status}) — add PROMED_API_KEY secret` };
  }
  if (!resp.ok) return { cases: [], error: `HTTP ${resp.status} from ProMED API` };

  const json = await resp.json() as { docs?: PromedDoc[] };
  const docs = (json.docs ?? []).filter((d) => HANTA_RE.test(`${d.title} ${d.excerpt ?? ""}`));

  const cases: CanonicalCase[] = docs.map((doc) => {
    const title = doc.title;
    const body = doc.excerpt ?? "";
    const combined = `${title} ${body}`;
    const m = title.match(PROMED_TITLE_RE);
    const rawCountry = m?.groups?.country?.trim() ?? "";
    const rawAdmin = m?.groups?.admin?.trim() ?? null;
    const rest = m?.groups?.rest?.trim() ?? "";
    const country = rawCountry ? toISO2(rawCountry) : "ZZ";

    return {
      source_slug: "promed",
      external_id: `promed-${doc.id}`,
      source_url: `https://www.promedmail.org/promed-post/${doc.slug}`,
      disease_slug: "hantavirus",
      location_lat: null, location_lng: null,
      location_name: [rawAdmin, rawCountry || (country !== "ZZ" ? country : null)].filter(Boolean).join(", ") || "Unknown",
      country, state_province: rawAdmin, county: null,
      case_count: extractCaseCount(body) || extractCaseCount(title) || 1,
      status: inferStatus(`${rest} ${combined}`),
      severity: null,
      strain: inferStrain(combined) ?? defaultStrainByCountry(country),
      reported_date: parseDate(doc.publishedAt),
      onset_date: null,
      raw_data: doc,
      notes: cleanText(body, 600) || null,
      dedupe_hash: dedupeHashFromId("promed", `promed-${doc.id}`),
    };
  });

  return { cases };
}

// ---------------------------------------------------------------------------
// Pipeline orchestrator
// ---------------------------------------------------------------------------
// deno-lint-ignore no-explicit-any
async function runSource(supabase: any, slug: string, cases: CanonicalCase[], fetchError?: string): Promise<SourceResult> {
  const result: SourceResult = { slug, fetched: cases.length, queued: 0, skipped: 0, errors: [] };
  if (fetchError) result.errors.push(fetchError);

  if (cases.length > 0) {
    const [{ data: disease }, { data: source }] = await Promise.all([
      supabase.from("diseases").select("id").eq("slug", "hantavirus").maybeSingle(),
      supabase.from("ingestion_sources").select("id").eq("slug", slug).maybeSingle(),
    ]);

    if (!disease?.id || !source?.id) {
      result.errors.push(`IDs not found for "${slug}" — run migrations`);
    } else {
      for (const c of cases) {
        const { error, status } = await supabase.from("cases").upsert(
          {
            disease_id: disease.id, source_id: source.id,
            external_id: c.external_id, source_url: c.source_url,
            location_lat: c.location_lat, location_lng: c.location_lng,
            location_name: c.location_name, country: c.country,
            state_province: c.state_province, county: c.county,
            case_count: c.case_count, status: c.status, severity: c.severity,
            strain: c.strain, reported_date: c.reported_date, onset_date: c.onset_date,
            raw_data: c.raw_data, notes: c.notes, dedupe_hash: c.dedupe_hash,
            is_published: false,
          },
          { onConflict: "dedupe_hash", ignoreDuplicates: false }
        );
        if (error) result.errors.push(`upsert: ${error.message}`);
        else if (status === 201) result.queued++;
        else result.skipped++;
      }
    }
  }

  // Update last_checked_at (and last_success_at if clean)
  const now = new Date().toISOString();
  const upd: Record<string, string> = { last_checked_at: now };
  if (result.errors.length === 0) upd.last_success_at = now;
  await supabase.from("ingestion_sources").update(upd).eq("slug", slug);

  return result;
}

// ---------------------------------------------------------------------------
// HTTP handler
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: { cadence?: string; slugs?: string[] } = {};
  try { body = await req.json(); } catch { /* empty body is fine */ }

  const { cadence = "all", slugs } = body;
  const runFast = cadence === "all" || cadence === "fast";
  const runDaily = cadence === "all" || cadence === "daily";
  const runSlug = (s: string) => !slugs?.length || slugs.includes(s);

  const startedAt = new Date();
  const results: SourceResult[] = [];

  // --- Fast sources (every 15 min) ---
  if (runFast && runSlug("promed")) {
    const { cases, error } = await fetchPromed();
    results.push(await runSource(supabase, "promed", cases, error));
  }

  // --- Daily sources ---
  if (runDaily && runSlug("who-don")) {
    const { cases, error } = await fetchWhoDon();
    results.push(await runSource(supabase, "who-don", cases, error));
  }

  const finishedAt = new Date();
  const totalErrors = results.reduce((s, r) => s + r.errors.length, 0);

  return new Response(
    JSON.stringify({
      startedAt,
      finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      sources: results,
      totals: {
        fetched: results.reduce((s, r) => s + r.fetched, 0),
        queued: results.reduce((s, r) => s + r.queued, 0),
        skipped: results.reduce((s, r) => s + r.skipped, 0),
        errors: totalErrors,
      },
    }),
    {
      status: totalErrors > 0 ? 207 : 200,
      headers: { "Content-Type": "application/json" },
    }
  );
});
