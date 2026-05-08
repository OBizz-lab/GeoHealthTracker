import { createClient } from "@supabase/supabase-js";

// =============================================================================
// Browser-safe Supabase client (anon key — RLS enforced)
// =============================================================================

let _client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!url || !key) return null; // graceful degradation — falls back to seed data

  _client = createClient(url, key);
  return _client;
}
