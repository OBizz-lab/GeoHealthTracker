import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// =============================================================================
// Browser-safe Supabase client (anon/publishable key — RLS enforced)
//
// We type the client as <any, any, any> on purpose: we don't ship generated
// Database types (yet), and the default `SupabaseClient<never>` makes every
// .insert({...}) fail strict type-checking with "Object literal may only
// specify known properties, and 'X' does not exist in type 'never[]'." When
// types are generated, swap `<any, any, any>` for `<Database>`.
//
// Custom fetch with AbortController timeout: supabase-js v2 takes a global
// `navigator.locks` lock around auth ops. If a fetch hangs (ad blocker,
// captive portal, OS proxy stall) the lock is held forever and every later
// supabase call in the tab queues indefinitely. The fetch-level timeout
// guarantees stuck requests actually abort, releasing the lock.
// =============================================================================

const FETCH_TIMEOUT_MS = 15_000;

const fetchWithTimeout: typeof fetch = (input, init) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  // Don't override caller-supplied aborts — chain them.
  const callerSignal = init?.signal;
  if (callerSignal) {
    if (callerSignal.aborted) ctrl.abort();
    else callerSignal.addEventListener("abort", () => ctrl.abort(), { once: true });
  }
  return fetch(input, { ...init, signal: ctrl.signal })
    .finally(() => clearTimeout(timer));
};

// Cache the client on globalThis so it survives Next.js Fast Refresh /
// HMR module re-evaluation. Without this, every hot-reload creates a new
// SupabaseClient while the old one's pending navigator.locks callback is
// still alive in the browser's lock manager — the lock is held by a
// ghost promise that will never resolve, and every later getSession() in
// the tab queues forever. Attaching to globalThis means hot-reload reuses
// the same client and the same lock owner.
//
// In production builds Fast Refresh doesn't run, but the globalThis cache
// is still harmless — globalThis is per-page anyway.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClientHolder = { _supabaseClient?: SupabaseClient<any, any, any> | null };
const _global = globalThis as unknown as ClientHolder;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabaseClient(): SupabaseClient<any, any, any> | null {
  if (_global._supabaseClient !== undefined) return _global._supabaseClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!url || !key) {
    _global._supabaseClient = null; // graceful degradation — falls back to seed data
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _global._supabaseClient = createClient<any, any, any>(url, key, {
    global: { fetch: fetchWithTimeout },
  });
  return _global._supabaseClient;
}

/**
 * Strict variant: returns a non-null client or throws. Use in admin code
 * where Supabase is mandatory — gives callers a non-nullable type, so
 * `supabase.from(...)` inside async closures doesn't lose narrowing and
 * trip strict TS checks on Vercel.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabaseClientStrict(): SupabaseClient<any, any, any> {
  const c = getSupabaseClient();
  if (!c) throw new Error("Supabase client is not configured (missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY).");
  return c;
}
