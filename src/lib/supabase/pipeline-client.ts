import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// =============================================================================
// Supabase client for the ingestion pipeline (server-side / Node.js only).
//
// Uses the SERVICE ROLE key — bypasses RLS so the pipeline can:
//   - INSERT into `cases` (is_published=false)
//   - UPSERT into `geocode_cache`
//   - UPDATE `ingestion_sources.last_checked_at`
//   - INSERT into `source_snapshots`
//
// ⚠️  NEVER expose this client or the service role key to the browser.
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: SupabaseClient<any, any, any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPipelineClient(): SupabaseClient<any, any, any> {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY;

  if (!url) {
    throw new Error(
      "[pipeline-client] Missing NEXT_PUBLIC_SUPABASE_URL env var",
    );
  }
  if (!key) {
    throw new Error(
      "[pipeline-client] Missing SUPABASE_SERVICE_ROLE_KEY env var",
    );
  }

  _client = createClient(url, key, {
    auth: {
      // Service role clients should not persist sessions
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return _client;
}
