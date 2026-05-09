import type { SignalNews, SignalReddit } from "@/lib/types";

// =============================================================================
// Live Signal data layer — reads from `signal_news` / `signal_reddit` /
// `signal_runs` cache tables (populated server-side by edge-function cron).
//
// Goes straight to PostgREST with `fetch()` and the anon key instead of
// through @supabase/supabase-js — that client takes a navigator.locks auth
// lock on every query and the lock can get poisoned, freezing every later
// SDK call in the tab. The data is public anyway (RLS `public_read`
// policies on all three tables allow anon reads), so the bearer is just
// the anon key — same as what supabase-js would have sent.
// =============================================================================

export interface SignalFeed {
  news:             SignalNews[];
  reddit:           SignalReddit[];
  updatedAt:        string | null;
  newsAvailable:    boolean;
  redditAvailable:  boolean;
}

const TOP_N = 15;
const FETCH_TIMEOUT_MS = 15_000;

const NEWS_COLS =
  "id,publisher_domain,publisher_name,publisher_logo_slug,publisher_region," +
  "country,headline,url,published_at,language";

const REDDIT_COLS =
  "id,thread_id,subreddit,author,author_flair,body,permalink,thread_url," +
  "thread_title,ups,num_replies,awards,velocity_score,created_at_reddit," +
  "language,removed";

async function pgrest<T>(path: string, signal: AbortSignal): Promise<T[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const res = await fetch(`${url}${path}`, {
    headers: {
      apikey:        key,
      Authorization: `Bearer ${key}`,
    },
    signal,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[signal] PostgREST ${path} → ${res.status}: ${body}`);
    return null;
  }
  return (await res.json()) as T[];
}

export async function fetchSignalFeed(): Promise<SignalFeed> {
  const empty: SignalFeed = {
    news: [], reddit: [], updatedAt: null,
    newsAvailable: false, redditAvailable: false,
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return empty;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);

  try {
    const since14d = new Date(Date.now() - 14 * 86_400_000).toISOString();

    const newsParams = new URLSearchParams({
      select:       NEWS_COLS,
      published_at: `gte.${since14d}`,
      order:        "published_at.desc",
      limit:        String(TOP_N),
    });
    const redditParams = new URLSearchParams({
      select:  REDDIT_COLS,
      removed: "eq.false",
      order:   "velocity_score.desc",
      limit:   String(TOP_N),
    });
    const runsParams = new URLSearchParams({
      select: "finished_at,source_slug",
      order:  "finished_at.desc",
      limit:  "1",
    });

    const [news, reddit, runs] = await Promise.all([
      pgrest<SignalNews>(`/rest/v1/signal_news?${newsParams.toString()}`, ctrl.signal),
      pgrest<SignalReddit>(`/rest/v1/signal_reddit?${redditParams.toString()}`, ctrl.signal),
      pgrest<{ finished_at: string }>(`/rest/v1/signal_runs?${runsParams.toString()}`, ctrl.signal),
    ]);

    return {
      news:            news ?? [],
      reddit:          reddit ?? [],
      updatedAt:       runs?.[0]?.finished_at ?? null,
      newsAvailable:   news !== null,
      redditAvailable: reddit !== null,
    };
  } catch (err) {
    console.error("[signal] fetch error:", err);
    return empty;
  } finally {
    clearTimeout(timer);
  }
}
