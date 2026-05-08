"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowBigUp,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageSquare,
  Newspaper,
} from "lucide-react";

import { signalCopy } from "@/lib/copy";
import { fetchSignalFeed, type SignalFeed } from "@/lib/supabase/signal";
import type { SignalNews, SignalReddit } from "@/lib/types";

// =============================================================================
// LiveSignalStrip — SOCIAL_INTEGRATION.md (Reddit replaces X — see §5.2 note)
// Collapsible bottom strip on /map only. Two tabs:
//   • Official news     (cyan accent, no chip)
//   • Reddit chatter    (amber accent + UNVERIFIED chip)
// Polls Supabase signal_news / signal_reddit cache tables every 60s.
// Persists tab + expanded state in localStorage.
// =============================================================================

type Tab = "news" | "reddit";
const STORAGE_KEY = "hvt:signal:state";
const POLL_INTERVAL_MS = 60_000;

interface StoredState { tab: Tab; expanded: boolean; }

function readStoredState(): StoredState {
  if (typeof window === "undefined") return { tab: "news", expanded: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { tab: "news", expanded: false };
    const v = JSON.parse(raw) as Partial<StoredState>;
    return {
      tab:      v.tab === "reddit" ? "reddit" : "news",
      expanded: !!v.expanded,
    };
  } catch {
    return { tab: "news", expanded: false };
  }
}

function writeStoredState(s: StoredState) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
  catch { /* swallow */ }
}

function relativeFromIso(iso: string | null): string {
  if (!iso) return "—";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000)        return "just now";
    if (diff < 3_600_000)     return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000)    return `${Math.floor(diff / 3_600_000)}h ago`;
    return `${Math.floor(diff / 86_400_000)}d ago`;
  } catch {
    return "—";
  }
}

// =============================================================================
// Component
// =============================================================================
export function LiveSignalStrip() {
  // Always start with the SSR-safe default. Reading localStorage during the
  // useState initializer caused a hydration mismatch — the server rendered
  // "news/collapsed" but the client (with a saved session) rendered
  // "reddit/expanded", and React tore the whole tree down. Hydrate from
  // localStorage AFTER mount via the useEffect below.
  const [{ tab, expanded }, setState] = useState<StoredState>({ tab: "news", expanded: false });
  const [hydrated, setHydrated]       = useState(false);
  const [feed, setFeed]               = useState<SignalFeed | null>(null);
  const [error, setError]             = useState<Error | null>(null);
  const [loading, setLoading]         = useState(true);
  const containerRef                  = useRef<HTMLDivElement | null>(null);

  // One-time hydration from localStorage (post-mount → no SSR mismatch).
  useEffect(() => {
    setState(readStoredState());
    setHydrated(true);
  }, []);

  // Persist state changes — but only AFTER initial hydration, otherwise we'd
  // overwrite the saved value with the SSR default on first render.
  useEffect(() => {
    if (!hydrated) return;
    writeStoredState({ tab, expanded });
  }, [tab, expanded, hydrated]);

  const load = useCallback(async () => {
    try {
      const f = await fetchSignalFeed();
      setFeed(f);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), POLL_INTERVAL_MS);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  // Keyboard: Esc collapses, n switches to news, r switches to reddit
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!containerRef.current?.contains(document.activeElement)) return;
      if (e.key === "Escape")    setState((s) => ({ ...s, expanded: false }));
      else if (e.key === "n")    setState(()  => ({ tab: "news",   expanded: true }));
      else if (e.key === "r")    setState(()  => ({ tab: "reddit", expanded: true }));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const newsCount   = feed?.news.length   ?? 0;
  const redditCount = feed?.reddit.length ?? 0;
  const updatedAt   = feed?.updatedAt ?? null;
  const peekText    = useMemo(() => {
    if (loading) return "";
    if (tab === "news"   && feed?.news[0])   return feed.news[0].headline;
    if (tab === "reddit" && feed?.reddit[0]) return feed.reddit[0].body.slice(0, 220);
    return "";
  }, [feed, tab, loading]);

  function toggleTab(next: Tab) {
    setState((s) => ({ tab: next, expanded: s.tab === next ? !s.expanded : true }));
  }
  function toggleExpanded() {
    setState((s) => ({ ...s, expanded: !s.expanded }));
  }

  return (
    <section
      role="region"
      aria-label={signalCopy.section_label}
      ref={containerRef}
      tabIndex={-1}
      style={{
        background:           "var(--map-overlay-bg)",
        backdropFilter:       "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderTop:            "1px solid var(--border-default)",
        boxShadow:            "0 -4px 16px rgba(0,0,0,0.4)",
      }}
    >
      {/* Header */}
      <div className="flex items-center" style={{ height: 40, padding: "0 14px", gap: 12 }}>
        <button
          onClick={toggleExpanded}
          className="flex items-center"
          style={{ gap: 8 }}
          aria-expanded={expanded}
          aria-label={expanded ? signalCopy.collapse_aria : signalCopy.expand_aria}
        >
          <Newspaper className="h-3.5 w-3.5" style={{ color: "var(--text-secondary)" }} />
          <span className="t-cap t-up" style={{ color: "var(--text-secondary)", letterSpacing: "0.06em" }}>
            {signalCopy.section_label}
          </span>
        </button>

        <div role="tablist" className="flex items-center" style={{ gap: 4 }}>
          <TabButton
            label={signalCopy.tab_news}
            count={newsCount}
            active={tab === "news"}
            accent="cyan"
            onClick={() => toggleTab("news")}
            ariaControls="signal-panel"
          />
          <TabButton
            label={signalCopy.tab_reddit}
            count={redditCount}
            active={tab === "reddit"}
            accent="amber"
            onClick={() => toggleTab("reddit")}
            ariaControls="signal-panel"
          />
        </div>

        {!expanded && peekText && (
          <span
            className="hidden sm:inline-block"
            style={{
              flex:         1,
              minWidth:     0,
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
              fontSize:     12,
              color:        "var(--text-secondary)",
            }}
          >
            {peekText}
          </span>
        )}

        <span
          className="hidden md:inline ml-auto"
          aria-live="polite"
          style={{ fontSize: 11, color: "var(--text-tertiary)" }}
        >
          Updated {relativeFromIso(updatedAt)}
        </span>

        <button
          onClick={toggleExpanded}
          className="ml-auto md:ml-0 inline-flex items-center justify-center"
          style={{ width: 28, height: 28, borderRadius: 6, color: "var(--text-secondary)" }}
          aria-label={expanded ? signalCopy.collapse_aria : signalCopy.expand_aria}
        >
          {expanded
            ? <ChevronDown className="h-4 w-4" />
            : <ChevronUp   className="h-4 w-4" />}
        </button>
      </div>

      {/* Body */}
      {expanded && (
        <div
          id="signal-panel"
          role="tabpanel"
          aria-labelledby={`signal-tab-${tab}`}
          className="flex flex-col"
          style={{
            height:     240,
            borderTop:  "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
          }}
        >
          <div className="flex-1 overflow-y-auto scroll-zinc" style={{ padding: 12 }}>
            {loading ? (
              <SkeletonList />
            ) : error ? (
              <ErrorState onRetry={load} />
            ) : tab === "news" ? (
              feed?.news.length ? (
                <ul className="flex flex-col" style={{ gap: 1 }}>
                  {feed.news.map((n) => <NewsCard key={n.id} item={n} />)}
                </ul>
              ) : (
                <EmptyState title={signalCopy.empty_news_title} body={signalCopy.empty_news_body} />
              )
            ) : feed?.reddit.length ? (
              <ul className="flex flex-col" style={{ gap: 1 }}>
                {feed.reddit.map((r) => <RedditCard key={r.id} item={r} />)}
              </ul>
            ) : (
              <EmptyState title={signalCopy.empty_reddit_title} body={signalCopy.empty_reddit_body} />
            )}
          </div>

          {/* Sticky disclaimer */}
          <div
            style={{
              padding:    "8px 14px",
              borderTop:  "1px solid var(--border-subtle)",
              fontSize:   11,
              lineHeight: "16px",
              color:      "var(--text-tertiary)",
              background: "var(--bg-surface)",
            }}
          >
            {tab === "news" ? signalCopy.disclaimer_news : signalCopy.disclaimer_reddit}
          </div>
        </div>
      )}
    </section>
  );
}

// =============================================================================
// Sub-components
// =============================================================================
function TabButton({
  label, count, active, accent, badge, onClick, ariaControls,
}: {
  label:    string;
  count:    number;
  active:   boolean;
  accent:   "cyan" | "amber";
  badge?:   string;
  onClick:  () => void;
  ariaControls: string;
}) {
  const accentColor = accent === "cyan" ? "var(--accent)" : "var(--status-suspected)";
  const chipBg      =
    accent === "cyan" ? "var(--accent-muted)" : "rgba(255,184,77,0.12)";
  return (
    <button
      role="tab"
      id={`signal-tab-${label}`}
      aria-selected={active}
      aria-controls={ariaControls}
      onClick={onClick}
      className="relative inline-flex items-center"
      style={{
        gap:          8,
        padding:      "6px 10px",
        borderRadius: 6,
        fontSize:     12,
        fontWeight:   500,
        color:        active ? "var(--text-primary)" : "var(--text-secondary)",
        cursor:       "pointer",
      }}
    >
      <span>{label}</span>
      <span
        className="num"
        style={{
          padding:      "1px 6px",
          borderRadius: 9999,
          fontSize:     10,
          fontWeight:   600,
          background:   chipBg,
          color:        accentColor,
        }}
      >
        {count}
      </span>
      {badge && (
        <span
          style={{
            padding:       "1px 6px",
            borderRadius:  9999,
            fontSize:      9,
            fontWeight:    700,
            letterSpacing: "0.04em",
            background:    "rgba(255,184,77,0.12)",
            color:         "var(--status-suspected)",
          }}
        >
          {badge}
        </span>
      )}
      {active && (
        <span
          aria-hidden
          style={{
            position:   "absolute",
            left:       10,
            right:      10,
            bottom:     -8,
            height:     2,
            background: accentColor,
          }}
        />
      )}
    </button>
  );
}

function NewsCard({ item }: { item: SignalNews }) {
  const date = relativeFromIso(item.published_at);
  return (
    <li>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${item.publisher_name} — ${item.headline}, opens in new tab`}
        className="flex items-center transition-colors"
        style={{ gap: 12, padding: "10px 8px", borderRadius: 6, color: "var(--text-primary)" }}
      >
        <span
          className="flex shrink-0 items-center justify-center"
          style={{
            width: 40, height: 40,
            borderRadius: 4,
            background:  "var(--accent-muted)",
            color:       "var(--accent)",
            fontSize:    11,
            fontWeight:  700,
          }}
        >
          {item.publisher_name.slice(0, 2).toUpperCase()}
        </span>
        <div className="flex flex-1 flex-col" style={{ minWidth: 0, gap: 2 }}>
          <div className="flex items-center" style={{ gap: 8, fontSize: 11, color: "var(--text-secondary)" }}>
            <span style={{ fontWeight: 500 }}>{item.publisher_name}</span>
            <span style={{ color: "var(--text-tertiary)" }}>·</span>
            <span style={{ color: "var(--text-tertiary)" }}>{date}</span>
            {item.country && item.country !== "ZZ" && (
              <>
                <span style={{ color: "var(--text-tertiary)" }}>·</span>
                <span className="t-mono" style={{ color: "var(--text-tertiary)" }}>{item.country}</span>
              </>
            )}
          </div>
          <p
            style={{
              fontSize:    13,
              lineHeight:  "18px",
              color:       "var(--text-primary)",
              display:     "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow:    "hidden",
            }}
          >
            {item.headline}
          </p>
        </div>
        <ExternalLink className="h-3 w-3 shrink-0" style={{ color: "var(--text-tertiary)" }} />
      </a>
    </li>
  );
}

function RedditCard({ item }: { item: SignalReddit }) {
  const date = relativeFromIso(item.created_at_reddit);
  return (
    <li>
      <a
        href={item.permalink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`u/${item.author} — ${item.body.slice(0, 80)}, opens in new tab`}
        className="flex items-start transition-colors"
        style={{ gap: 12, padding: "10px 8px", borderRadius: 6, color: "var(--text-primary)" }}
      >
        <span
          className="flex shrink-0 items-center justify-center"
          style={{
            width:        40, height: 40,
            borderRadius: 9999,
            background:   "rgba(255,184,77,0.12)",
            color:        "var(--status-suspected)",
            fontSize:     11,
            fontWeight:   700,
          }}
        >
          {item.author.slice(0, 2).toUpperCase()}
        </span>
        <div className="flex flex-1 flex-col" style={{ minWidth: 0, gap: 4 }}>
          <div className="flex items-center" style={{ gap: 8, fontSize: 11, color: "var(--text-secondary)" }}>
            <span style={{ fontWeight: 500 }}>u/{item.author}</span>
            {item.author_flair && (
              <>
                <span style={{ color: "var(--text-tertiary)" }}>·</span>
                <span
                  style={{
                    fontSize:     10,
                    padding:      "0 6px",
                    borderRadius: 9999,
                    background:   "rgba(255,184,77,0.10)",
                    color:        "var(--status-suspected)",
                  }}
                >
                  {item.author_flair}
                </span>
              </>
            )}
            <span style={{ color: "var(--text-tertiary)" }}>·</span>
            <span style={{ color: "var(--text-tertiary)" }}>r/{item.subreddit}</span>
            <span style={{ color: "var(--text-tertiary)" }}>·</span>
            <span style={{ color: "var(--text-tertiary)" }}>{date}</span>
          </div>
          <p
            style={{
              fontSize:    13,
              lineHeight:  "18px",
              color:       "var(--text-primary)",
              display:     "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow:    "hidden",
            }}
          >
            {item.body}
          </p>
          <div className="flex items-center" style={{ gap: 12, fontSize: 11, color: "var(--text-tertiary)" }}>
            <span className="inline-flex items-center" style={{ gap: 4 }}>
              <ArrowBigUp className="h-3 w-3" />{item.ups.toLocaleString()}
            </span>
            <span className="inline-flex items-center" style={{ gap: 4 }}>
              <MessageSquare className="h-3 w-3" />{item.num_replies.toLocaleString()}
            </span>
          </div>
        </div>
        <ExternalLink className="h-3 w-3 shrink-0" style={{ color: "var(--text-tertiary)" }} />
      </a>
    </li>
  );
}

function SkeletonList() {
  return (
    <ul className="flex flex-col" style={{ gap: 8 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <li key={i}>
          <div className="flex items-center" style={{ gap: 12, padding: "10px 8px" }}>
            <div className="skel" style={{ width: 40, height: 40, borderRadius: 4 }} />
            <div className="flex flex-1 flex-col" style={{ gap: 6 }}>
              <div className="skel" style={{ height: 10, width: "30%" }} />
              <div className="skel" style={{ height: 14, width: "85%" }} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center text-center"
      style={{ padding: 32, gap: 6 }}
    >
      <div className="t-label" style={{ color: "var(--text-primary)" }}>{title}</div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 360 }}>{body}</div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center text-center"
      style={{ padding: 32, gap: 8 }}
    >
      <div className="t-label" style={{ color: "var(--text-primary)" }}>{signalCopy.error_title}</div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{signalCopy.error_body}</div>
      <button
        onClick={onRetry}
        style={{
          marginTop:    8,
          padding:      "6px 12px",
          borderRadius: 6,
          background:   "var(--bg-elevated)",
          border:       "1px solid var(--border-default)",
          color:        "var(--text-primary)",
          fontSize:     12,
          fontWeight:   500,
          cursor:       "pointer",
        }}
      >
        {signalCopy.error_retry_label}
      </button>
    </div>
  );
}
