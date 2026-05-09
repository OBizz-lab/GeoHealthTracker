// =============================================================================
// Browser-side auth helpers that DO NOT use @supabase/supabase-js.
//
// supabase-js v2 takes a navigator.locks lock around every auth method,
// including getSession() and any from(...).query() that needs the bearer
// token. On some environments (HMR, hung auto-refresh, browser quirks)
// that lock gets poisoned and never releases — every later SDK call in
// the tab queues forever, and any page that renders `null` while it
// "checks the session" stays blank indefinitely.
//
// Workaround: read the session straight out of localStorage and hit the
// PostgREST and GoTrue endpoints with raw fetch(). No SDK, no lock, no
// deadlock. We still call supabase-js for the actual sign-in / sign-up
// operations because those are network-driven anyway.
// =============================================================================

export interface StoredSession {
  access_token: string;
  user_id:      string;
  /** epoch seconds */
  exp:          number;
}

function getProjectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.match(/^https:\/\/([^.]+)/)?.[1] ?? null;
}

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const [, payloadB64] = token.split(".");
    if (!payloadB64) return null;
    // JWT uses URL-safe base64 (- → +, _ → /). Pad to multiple of 4.
    const pad = "=".repeat((4 - (payloadB64.length % 4)) % 4);
    const json = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/") + pad);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Read the current session straight out of localStorage. Returns null if
 * there's no session, the token is malformed, or the token is expired.
 */
export function readStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  const ref = getProjectRef();
  if (!ref) return null;

  const raw = window.localStorage.getItem(`sb-${ref}-auth-token`);
  if (!raw) return null;

  let access_token: string | null = null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Chunked storage (rare in localStorage; mostly for cookies)
      try {
        const inner = JSON.parse(atob(parsed.join("").replace(/^base64-/, "")));
        access_token = typeof inner?.access_token === "string" ? inner.access_token : null;
      } catch { /* */ }
    } else {
      access_token = typeof parsed?.access_token === "string" ? parsed.access_token : null;
    }
  } catch {
    return null;
  }
  if (!access_token) return null;

  const claims = decodeJwt(access_token);
  if (!claims) return null;
  const sub = typeof claims.sub === "string" ? claims.sub : null;
  const exp = typeof claims.exp === "number" ? claims.exp : null;
  if (!sub || !exp) return null;
  if (exp * 1000 < Date.now()) return null; // expired

  return { access_token, user_id: sub, exp };
}

/**
 * Pull the username out of the JWT — first from user_metadata.username
 * (set during signup), then by stripping the synthetic noreply domain
 * off the email claim (legacy email-based accounts). Returns "" if
 * neither is available.
 */
export function readUsername(session: StoredSession): string {
  const claims = decodeJwt(session.access_token);
  if (!claims) return "";
  const meta = claims.user_metadata as { username?: unknown } | undefined;
  if (meta && typeof meta.username === "string") return meta.username;
  const email = typeof claims.email === "string" ? claims.email : "";
  if (!email) return "";
  // Strip synthetic noreply domain; otherwise return the raw email so legacy
  // accounts still show something readable.
  const SYNTHETIC = "@noreply.hantavirustrack.org";
  return email.endsWith(SYNTHETIC) ? email.slice(0, -SYNTHETIC.length) : email;
}

/**
 * Same-tab auth-change broadcast. The browser's `storage` event fires only
 * in OTHER tabs when localStorage changes — never in the tab that wrote
 * the change. So after a sign-in / sign-out / "you've just been approved"
 * redirect, every other component in the same tab still has stale auth
 * state. We solve that with a custom window event: any code that mutates
 * auth state calls notifyAuthChange(), and listeners (header, +Add button,
 * etc.) re-evaluate session + admin status when they hear it.
 */
export const AUTH_CHANGE_EVENT = "ghtracker:auth-change";

export function notifyAuthChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

/**
 * Drop the stored session. Used when sign-out happens to give the user
 * an immediate UI update without waiting on supabase.auth.signOut() to
 * acquire the lock.
 */
export function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  const ref = getProjectRef();
  if (!ref) return;
  try {
    window.localStorage.removeItem(`sb-${ref}-auth-token`);
    // supabase-js sometimes also writes -code-verifier and -refresh-token
    // siblings; clear anything matching the prefix to be thorough.
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(`sb-${ref}-`)) window.localStorage.removeItem(k);
    }
  } catch { /* */ }
}

// ----- raw PostgREST helpers -----------------------------------------------

const FETCH_TIMEOUT_MS = 12_000;

async function pgrestFetch<T>(
  path: string,
  opts: { token?: string; method?: string; body?: unknown } = {},
): Promise<T | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {
      apikey:        key,
      Authorization: `Bearer ${opts.token ?? key}`,
    };
    if (opts.body !== undefined) headers["Content-Type"] = "application/json";
    if (opts.method === "POST")  headers["Prefer"]       = "return=representation";

    const res = await fetch(`${url}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body:   opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[auth] PostgREST ${opts.method ?? "GET"} ${path} → ${res.status}: ${text}`);
      return null;
    }
    if (res.status === 204) return null;
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[auth] fetch error on ${path}:`, err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** True if the user has a non-revoked admin grant. */
export async function fetchIsApprovedAdmin(session: StoredSession): Promise<boolean> {
  const params = new URLSearchParams({
    select:     "user_id",
    user_id:    `eq.${session.user_id}`,
    revoked_at: "is.null",
  });
  const rows = await pgrestFetch<Array<{ user_id: string }>>(
    `/rest/v1/admin_grants?${params.toString()}`,
    { token: session.access_token },
  );
  return Array.isArray(rows) && rows.length > 0;
}

/** Look up the user's admin_signups row (status, reviewer_note). */
export async function fetchPendingSignup(
  session: StoredSession,
): Promise<{ status: string; reviewer_note: string | null } | null> {
  const params = new URLSearchParams({
    select:  "status,reviewer_note",
    user_id: `eq.${session.user_id}`,
  });
  const rows = await pgrestFetch<Array<{ status: string; reviewer_note: string | null }>>(
    `/rest/v1/admin_signups?${params.toString()}`,
    { token: session.access_token },
  );
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

/** POST/PATCH/DELETE shim that returns null on success, an error string on
 *  failure. Centralizes the timeout + JSON error parsing logic so all the
 *  raw-fetch mutate helpers share one implementation. */
async function pgrestMutate(
  path: string,
  opts: { method: "POST" | "PATCH" | "DELETE"; token: string; body?: unknown },
): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return "Server not configured.";

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {
      apikey:        key,
      Authorization: `Bearer ${opts.token}`,
      Prefer:        "return=minimal",
    };
    if (opts.body !== undefined) headers["Content-Type"] = "application/json";

    const res = await fetch(`${url}${path}`, {
      method:  opts.method,
      headers,
      body:    opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal:  ctrl.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      try {
        const j = JSON.parse(text) as { message?: string };
        return j.message ?? `${opts.method} ${path} failed (${res.status})`;
      } catch {
        return text || `${opts.method} ${path} failed (${res.status})`;
      }
    }
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : "Network error.";
  } finally {
    clearTimeout(timer);
  }
}

/** Insert into admin_signups via raw POST. Returns null on success, an
 *  error message on failure. */
export async function insertAdminSignup(
  session: StoredSession,
  username: string,
  contribution: string,
): Promise<string | null> {
  return pgrestMutate("/rest/v1/admin_signups", {
    method: "POST",
    token:  session.access_token,
    body:   {
      user_id:                session.user_id,
      username,
      contribution_statement: contribution,
    },
  });
}

// ----- /admin/queue helpers -------------------------------------------------

export interface QueuedCase {
  id:                string;
  location_name:     string | null;
  country:           string | null;
  state_province:    string | null;
  status:            string;
  strain:            string | null;
  case_count:        number;
  fatality_count:    number;
  reported_date:     string | null;
  source_url:        string | null;
  notes:             string | null;
  is_published:      boolean;
  location_lat:      number | null;
  location_lng:      number | null;
  created_at:        string;
  submitted_by:      string | null;
  ingestion_sources: { name: string; slug: string } | null;
}

const QUEUE_CASE_COLS =
  "id,location_name,country,state_province,status,strain,case_count," +
  "fatality_count,reported_date,source_url,notes,is_published," +
  "location_lat,location_lng,created_at,submitted_by," +
  "ingestion_sources(name,slug)";

export async function fetchQueueCases(
  session: StoredSession,
  filter: "pending" | "published" | "all",
): Promise<QueuedCase[]> {
  const params = new URLSearchParams({
    select: QUEUE_CASE_COLS,
    order:  "created_at.desc",
    limit:  "100",
  });
  if (filter === "pending") {
    // Pending = not yet approved AND not rejected. Rejected cases are
    // kept (soft-deleted via rejected_at) so the admin-list page can
    // count them — they should NOT show up under "pending".
    params.append("is_published", "eq.false");
    params.append("rejected_at",  "is.null");
  }
  if (filter === "published") params.append("is_published", "eq.true");

  const rows = await pgrestFetch<QueuedCase[]>(
    `/rest/v1/cases?${params.toString()}`,
    { token: session.access_token },
  );
  return rows ?? [];
}

export async function updateCasePublished(
  session: StoredSession,
  caseId:  string,
  value:   boolean,
): Promise<string | null> {
  return pgrestMutate(`/rest/v1/cases?id=eq.${caseId}`, {
    method: "PATCH",
    token:  session.access_token,
    body:   { is_published: value },
  });
}

/**
 * Soft-reject a pending case: marks rejected_at + rejected_by but keeps
 * the row so the /admin/list page can count it under the submitter's
 * rejected total. Replaces the old destructive delete path.
 */
export async function rejectCase(
  session: StoredSession,
  caseId:  string,
): Promise<string | null> {
  return pgrestMutate(`/rest/v1/cases?id=eq.${caseId}`, {
    method: "PATCH",
    token:  session.access_token,
    body:   {
      rejected_at:  new Date().toISOString(),
      rejected_by:  session.user_id,
      is_published: false,
    },
  });
}

export async function fetchPendingSignupCount(
  session: StoredSession,
): Promise<number> {
  const params = new URLSearchParams({ select: "id", status: "eq.pending" });
  const rows = await pgrestFetch<Array<{ id: string }>>(
    `/rest/v1/admin_signups?${params.toString()}`,
    { token: session.access_token },
  );
  return Array.isArray(rows) ? rows.length : 0;
}

// ----- /admin/grants helpers ------------------------------------------------

export interface AdminSignupRow {
  id:                     string;
  user_id:                string;
  username:               string;
  contribution_statement: string;
  status:                 "pending" | "approved" | "rejected";
  reviewer_note:          string | null;
  created_at:             string;
}

export async function fetchAdminSignups(
  session: StoredSession,
  filter:  "pending" | "all",
): Promise<AdminSignupRow[]> {
  const params = new URLSearchParams({
    select: "id,user_id,username,contribution_statement,status,reviewer_note,created_at",
    order:  "created_at.desc",
  });
  if (filter === "pending") params.append("status", "eq.pending");
  const rows = await pgrestFetch<AdminSignupRow[]>(
    `/rest/v1/admin_signups?${params.toString()}`,
    { token: session.access_token },
  );
  return rows ?? [];
}

export async function insertAdminGrant(
  session:     StoredSession,
  targetUserId: string,
  notes:       string,
): Promise<string | null> {
  return pgrestMutate("/rest/v1/admin_grants", {
    method: "POST",
    token:  session.access_token,
    body:   {
      user_id:    targetUserId,
      granted_by: session.user_id,
      notes,
    },
  });
}

// ----- /admin/list helpers --------------------------------------------------

export interface AdminListRow {
  user_id:         string;
  username:        string | null;
  granted_at:      string;
  accepted_count:  number;
  pending_count:   number;
  rejected_count:  number;
}

/** Pull the per-admin submission stats from the admin_list_stats view.
 *  RLS on the view's underlying tables (security_invoker = on) means
 *  non-admins receive an empty array. */
export async function fetchAdminList(
  session: StoredSession,
): Promise<AdminListRow[]> {
  const params = new URLSearchParams({
    select: "user_id,username,granted_at,accepted_count,pending_count,rejected_count",
    order:  "granted_at.asc",
  });
  const rows = await pgrestFetch<AdminListRow[]>(
    `/rest/v1/admin_list_stats?${params.toString()}`,
    { token: session.access_token },
  );
  return rows ?? [];
}

export async function updateAdminSignupStatus(
  session:       StoredSession,
  signupId:      string,
  status:        "approved" | "rejected",
  reviewerNote?: string | null,
): Promise<string | null> {
  const body: Record<string, unknown> = {
    status,
    reviewed_by: session.user_id,
    reviewed_at: new Date().toISOString(),
  };
  if (reviewerNote !== undefined) body.reviewer_note = reviewerNote;
  return pgrestMutate(`/rest/v1/admin_signups?id=eq.${signupId}`, {
    method: "PATCH",
    token:  session.access_token,
    body,
  });
}
