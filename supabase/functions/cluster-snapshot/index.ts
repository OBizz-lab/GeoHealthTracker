import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "node:crypto";

// =============================================================================
// HantaVirusTrack — Cluster Snapshot Edge Function
// POST /functions/v1/cluster-snapshot
// Body: { cluster_id?: string }   (omit → process all configured clusters)
//
// For each (cluster, source) pair:
//   1. Fetch the source URL (HTML).
//   2. Extract reported_total_cases / reported_total_fatalities via regex.
//   3. Write a row to `cluster_snapshots` (history + diff trigger).
// Then call public.apply_cluster_canonical(cluster_id) which picks the
// highest-priority source's most-recent snapshot (CASE_COUNT_METHODOLOGY §5)
// and syncs the cluster's primary `cases` row to those canonical totals.
//
// Reconciliation policy: source HIERARCHY (WHO > CDC/PHAC > ECDC/PAHO/AfCDC),
// not headcount consensus — see methodology §5 for rationale.
// =============================================================================

interface ClusterSourceConfig {
  cluster_id: string;
  sources: { url: string; label: string }[];
}

// Hardcoded for V1. Move to a `cluster_source_config` table when generalizing.
// URLs sourced from HONDIUS_OUTBREAK_DATA.md §1.
const CLUSTER_CONFIGS: ClusterSourceConfig[] = [
  {
    cluster_id: "mv-hondius-2026",
    sources: [
      { url: "https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON599",                                                              label: "WHO DON 599" },
      { url: "https://www.who.int/news/item/07-05-2026-who-s-response-to-hantavirus-cases-linked-to-a-cruise-ship",                                 label: "WHO News (07 May 2026)" },
      { url: "https://www.ecdc.europa.eu/en/publications-data/hantavirus-associated-cluster-illness-cruise-ship-ecdc-assessment-and",               label: "ECDC Assessment" },
      { url: "https://www.cdc.gov/media/releases/2026-hantavirus-confirmed-cruise-ship.html",                                                       label: "CDC Statement" },
      { url: "https://africacdc.org/news-item/statement-on-multi-country-hantavirus-cluster-associated-with-cruise-ship-travel/",                   label: "Africa CDC Statement" },
    ],
  },
];

interface ExtractedCounts {
  cases: number | null;
  fatalities: number | null;
  evidence: { cases?: string; fatalities?: string };
}

// ---------------------------------------------------------------------------
// Number extraction — regex on text content. Handles digits + word-numbers up
// to twenty (sufficient for outbreak-scale counts). Documented limitation:
// brittle vs. prose phrasing. Production upgrade is LLM-based extraction with
// a structured-output schema. See README → "Cluster snapshot system".
// ---------------------------------------------------------------------------
const WORD_NUMBERS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20,
};

function parseNumberToken(tok: string): number | null {
  const n = parseInt(tok.replace(/,/g, ""), 10);
  if (!isNaN(n)) return n;
  const w = tok.toLowerCase();
  return w in WORD_NUMBERS ? WORD_NUMBERS[w] : null;
}

const NUM_TOK = "(\\d{1,5}|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)";

// Strip HTML tags + collapse whitespace.
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

// Pick the LARGEST plausible match — outbreak articles often quote both
// historical and current numbers; the cumulative total is usually the largest.
// (Real production extraction would use the article's "as of" framing.)
function extractMaxNumber(text: string, pattern: RegExp): { value: number | null; evidence?: string } {
  let max: number | null = null;
  let evidence: string | undefined;
  for (const m of text.matchAll(pattern)) {
    const n = parseNumberToken(m[1]);
    if (n != null && (max == null || n > max)) {
      max = n;
      // 80-char snippet around the match for the audit log.
      const start = Math.max(0, m.index! - 30);
      const end   = Math.min(text.length, m.index! + m[0].length + 30);
      evidence = text.slice(start, end);
    }
  }
  return { value: max, evidence };
}

function extractCounts(html: string): ExtractedCounts {
  const text = htmlToText(html);

  // Cases: "(N) cases / patients / persons infected / cluster cases / total cases"
  const casesPattern = new RegExp(
    `${NUM_TOK}\\s+(?:total\\s+|cluster\\s+|confirmed\\s+|reported\\s+)?(?:cases|patients|persons?\\s+infected|infections)`,
    "gi",
  );
  const cases = extractMaxNumber(text, casesPattern);

  // Fatalities: "(N) deaths / fatalities / died / fatal cases / dead"
  const deathsPattern = new RegExp(
    `${NUM_TOK}\\s+(?:deaths?|fatalities|fatal(?:\\s+cases?)?|died|deceased|dead)`,
    "gi",
  );
  const deaths = extractMaxNumber(text, deathsPattern);

  return {
    cases: cases.value,
    fatalities: deaths.value,
    evidence: { cases: cases.evidence, fatalities: deaths.evidence },
  };
}

// ---------------------------------------------------------------------------
// Fetch one source. Returns null on network failure / non-2xx so the cluster
// can reconcile from whichever sources DID return data.
// ---------------------------------------------------------------------------
async function fetchSource(url: string, timeoutMs = 15_000): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: {
        "user-agent": "HantaVirusTrack/1.0 (cluster-snapshot scraper)",
        "accept": "text/html,application/xhtml+xml",
      },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

// ---------------------------------------------------------------------------
// Process one cluster: fetch every configured source, write snapshots, then
// apply the canonical totals to the cluster's primary `cases` row.
// ---------------------------------------------------------------------------
interface SourceResult {
  url:          string;
  label:        string;
  ok:           boolean;
  reason?:      string;
  cases?:       number | null;
  fatalities?:  number | null;
}

async function processCluster(
  supabase: ReturnType<typeof createClient>,
  cfg: ClusterSourceConfig,
) {
  const results: SourceResult[] = [];

  for (const src of cfg.sources) {
    const html = await fetchSource(src.url);
    if (html == null) {
      results.push({ url: src.url, label: src.label, ok: false, reason: "fetch_failed" });
      continue;
    }
    const counts = extractCounts(html);
    if (counts.cases == null && counts.fatalities == null) {
      results.push({ url: src.url, label: src.label, ok: false, reason: "no_counts_extracted" });
      continue;
    }

    const canonicalText = htmlToText(html).slice(0, 20_000);
    const { error } = await supabase.from("cluster_snapshots").insert({
      cluster_id:                cfg.cluster_id,
      source_url:                src.url,
      reported_total_cases:      counts.cases,
      reported_total_fatalities: counts.fatalities,
      reported_breakdown:        { evidence: counts.evidence, label: src.label },
      payload_hash:              sha256(canonicalText),
      notes:                     `Extracted via regex. Cases evidence: "${counts.evidence.cases ?? "—"}". Fatalities evidence: "${counts.evidence.fatalities ?? "—"}".`,
    });

    if (error) {
      results.push({ url: src.url, label: src.label, ok: false, reason: `db_error: ${error.message}` });
      continue;
    }

    results.push({
      url:        src.url,
      label:      src.label,
      ok:         true,
      cases:      counts.cases,
      fatalities: counts.fatalities,
    });
  }

  // Reconcile: pick the highest-priority source's most-recent snapshot and
  // sync the cluster's primary row in `cases` to those totals.
  const { data: applyResult, error: applyErr } = await supabase.rpc(
    "apply_cluster_canonical",
    { p_cluster_id: cfg.cluster_id },
  );

  return {
    cluster_id: cfg.cluster_id,
    sources:    results,
    applied:    applyErr ? { error: applyErr.message } : applyResult,
  };
}

// ---------------------------------------------------------------------------
// HTTP entry point
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({} as { cluster_id?: string }));
  const wanted = body.cluster_id ? [body.cluster_id] : null;
  const targets = wanted
    ? CLUSTER_CONFIGS.filter((c) => wanted.includes(c.cluster_id))
    : CLUSTER_CONFIGS;

  if (targets.length === 0) {
    return new Response(
      JSON.stringify({ error: `unknown cluster_id; configured: ${CLUSTER_CONFIGS.map((c) => c.cluster_id).join(", ")}` }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const out = await Promise.all(targets.map((c) => processCluster(supabase, c)));
  return new Response(JSON.stringify({ ok: true, clusters: out }, null, 2), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});
