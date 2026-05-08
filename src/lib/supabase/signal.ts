import { getSupabaseClient } from "./client";
import type { SignalNews, SignalReddit } from "@/lib/types";

// =============================================================================
// Live Signal data layer — reads from `signal_news` / `signal_reddit` cache
// tables (populated server-side by the Edge Function on cron).
// =============================================================================

export interface SignalFeed {
  news:             SignalNews[];
  reddit:           SignalReddit[];
  updatedAt:        string | null;
  newsAvailable:    boolean;
  redditAvailable:  boolean;
}

const TOP_N = 15;

export async function fetchSignalFeed(): Promise<SignalFeed> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      news: [], reddit: [], updatedAt: null,
      newsAvailable: false, redditAvailable: false,
    };
  }

  // ── News: top 15 most recent within 14 days ────────────────────────────
  const since14d = new Date(Date.now() - 14 * 86_400_000).toISOString();
  const newsP = supabase
    .from("signal_news")
    .select(`id, publisher_domain, publisher_name, publisher_logo_slug, publisher_region,
             country, headline, url, published_at, language`)
    .gte("published_at", since14d)
    .order("published_at", { ascending: false })
    .limit(TOP_N);

  // ── Reddit: top 15 by velocity_score ────────────────────────────────────
  const redditP = supabase
    .from("signal_reddit")
    .select(`id, thread_id, subreddit, author, author_flair, body, permalink,
             thread_url, thread_title, ups, num_replies, awards, velocity_score,
             created_at_reddit, language, removed`)
    .eq("removed", false)
    .order("velocity_score", { ascending: false })
    .limit(TOP_N);

  const [newsRes, redditRes] = await Promise.all([newsP, redditP]);

  const updatedP = await supabase
    .from("signal_runs")
    .select("finished_at, source_slug")
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    news:            ((newsRes.data   ?? []) as unknown as SignalNews[]),
    reddit:          ((redditRes.data ?? []) as unknown as SignalReddit[]),
    updatedAt:       (updatedP.data as { finished_at?: string } | null)?.finished_at ?? null,
    newsAvailable:   !newsRes.error,
    redditAvailable: !redditRes.error,
  };
}
