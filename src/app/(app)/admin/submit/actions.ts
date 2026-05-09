"use server";

import { createClient } from "@supabase/supabase-js";

// =============================================================================
// /admin/submit Server Action.
// The browser-side @supabase/supabase-js client uses navigator.locks for its
// auth mutex; under Next.js HMR or background auto-refresh the lock can get
// poisoned and every later supabase call in the tab queues forever. Moving
// the actual insert to a Server Action sidesteps that entirely: the browser
// never calls Supabase here. It just hands us its access token and the form
// payload; we re-create a stateless Supabase client server-side, validate
// the token, and run the insert under the same RLS policies a logged-in
// browser would.
//
// SECURITY: Server Actions are reachable as raw POST endpoints, not just
// through the form UI. We re-validate the bearer token on every call and
// rely on RLS (`cases_admin_insert` requires `is_approved_admin()`) to gate
// the actual write. We never use the service role key here.
// =============================================================================

export type SubmissionKind = "confirmed" | "mention" | "exposed";

export interface SubmitCaseInput {
  accessToken:    string;
  /** Discriminator: confirmed = official case data, mention = news article,
   *  exposed = surveillance follow-up ("spread"). */
  kind:           SubmissionKind;
  source_url:     string;
  location_name:  string | null;
  country:        string | null;
  state_province: string | null;
  location_lat:   number | null;
  location_lng:   number | null;
  status:         "suspected" | "confirmed" | "fatal";
  strain:         "sin_nombre" | "andes" | "seoul" | "puumala" | "other" | null;
  case_count:     number;
  fatality_count: number;
  reported_date:  string;
  notes:          string | null;
}

export type SubmitCaseResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitCase(input: SubmitCaseInput): Promise<SubmitCaseResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { ok: false, error: "Server not configured." };
  if (!input.accessToken) return { ok: false, error: "Missing session token. Sign in again." };

  // Server-side input revalidation. The browser already validates, but
  // Server Actions are also reachable via direct POST so we trust nothing.
  if (input.kind !== "confirmed" && input.kind !== "mention" && input.kind !== "exposed") {
    return { ok: false, error: "Invalid submission type." };
  }
  if (!/^https:\/\//.test(input.source_url)) {
    return { ok: false, error: "Source URL must start with https://" };
  }
  if (!input.country) {
    return { ok: false, error: "Country (ISO-2) is required." };
  }
  if (input.kind === "confirmed") {
    if (!Number.isFinite(input.case_count) || input.case_count < 1) {
      return { ok: false, error: "Case count must be ≥ 1." };
    }
    if (!Number.isFinite(input.fatality_count) || input.fatality_count < 0) {
      return { ok: false, error: "Fatality count must be ≥ 0." };
    }
    if (input.fatality_count > input.case_count) {
      return { ok: false, error: "Fatality count cannot exceed case count." };
    }
    if (input.status === "fatal" && input.fatality_count < 1) {
      return { ok: false, error: "Status 'fatal' requires fatality count ≥ 1." };
    }
  }
  if ((input.location_lat == null) !== (input.location_lng == null)) {
    return { ok: false, error: "Provide both latitude and longitude, or neither." };
  }

  // Stateless client tagged with the user's bearer token. RLS still applies
  // (anon key + JWT) — this user can only insert rows that the
  // cases_admin_insert policy allows.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient<any, any, any>(url, key, {
    global: { headers: { Authorization: `Bearer ${input.accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser(input.accessToken);
  if (userErr || !userData.user) {
    return { ok: false, error: "Session invalid or expired. Sign in again." };
  }
  const userId = userData.user.id;

  const { data: disease, error: diseaseErr } = await supabase
    .from("diseases")
    .select("id")
    .eq("slug", "hantavirus")
    .single();
  if (diseaseErr) return { ok: false, error: `Disease lookup failed: ${diseaseErr.message}` };
  if (!disease) return { ok: false, error: 'Disease "hantavirus" not seeded.' };

  const { error: insertErr } = await supabase.from("cases").insert({
    disease_id:     (disease as { id: string }).id,
    kind:           input.kind,
    source_url:     input.source_url,
    location_name:  input.location_name,
    country:        input.country,
    state_province: input.state_province,
    location_lat:   input.location_lat,
    location_lng:   input.location_lng,
    status:         input.status,
    strain:         input.strain,
    case_count:     input.case_count,
    fatality_count: input.fatality_count,
    reported_date:  input.reported_date,
    notes:          input.notes,
    is_published:   false,
    submitted_by:   userId,
  });

  if (insertErr) {
    return {
      ok: false,
      error: `Insert failed: ${insertErr.message}${insertErr.code ? ` (code ${insertErr.code})` : ""}`,
    };
  }

  return { ok: true };
}
