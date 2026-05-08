import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// =============================================================================
// Browser-safe Supabase client (anon/publishable key — RLS enforced)
//
// We type the client as <any, any, any> on purpose: we don't ship generated
// Database types (yet), and the default `SupabaseClient<never>` makes every
// .insert({...}) fail strict type-checking with "Object literal may only
// specify known properties, and 'X' does not exist in type 'never[]'." When
// types are generated, swap `<any, any, any>` for `<Database>`.
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: SupabaseClient<any, any, any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabaseClient(): SupabaseClient<any, any, any> | null {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!url || !key) return null; // graceful degradation — falls back to seed data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _client = createClient<any, any, any>(url, key);
  return _client;
}
