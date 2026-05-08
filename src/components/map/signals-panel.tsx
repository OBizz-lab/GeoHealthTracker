"use client";

import { useMemo, useState } from "react";
import { Search, X, ChevronLeft, Radio } from "lucide-react";
import { colors, statusLabels } from "@/lib/design-tokens";
import type { Report } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days < 1)   return "today";
    if (days === 1) return "1d ago";
    if (days < 30)  return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface SignalsPanelProps {
  reports: Report[];
}

export function SignalsPanel({ reports }: SignalsPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch]       = useState("");

  const sorted = useMemo(() => {
    const q = search.toLowerCase();
    return [...reports]
      .sort((a, b) => new Date(b.reported_date).getTime() - new Date(a.reported_date).getTime())
      .filter((r) => {
        if (!q) return true;
        return (
          r.location_name.toLowerCase().includes(q) ||
          r.country.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q) ||
          r.source_name.toLowerCase().includes(q)
        );
      });
  }, [reports, search]);

  // ── Collapsed pill ────────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="pointer-events-auto flex items-center gap-2 rounded-xl border border-[#27314a] bg-[#111827]/95 px-3 py-2 text-xs text-zinc-300 shadow-2xl backdrop-blur-md hover:bg-[#1f2937]/95 transition-colors"
      >
        <Radio className="h-3.5 w-3.5 text-blue-400" />
        <span className="font-medium">Recent Signals</span>
        <span className="ml-0.5 rounded-full bg-blue-600/25 px-1.5 py-0.5 text-[10px] font-semibold text-blue-300">
          {reports.length}
        </span>
        <ChevronLeft className="ml-1 h-3.5 w-3.5 text-zinc-600 rotate-180" />
      </button>
    );
  }

  // ── Expanded panel ────────────────────────────────────────────────────────
  return (
    <div className="pointer-events-auto flex h-full w-72 flex-col rounded-xl border border-[#27314a] bg-[#111827]/95 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#27314a] px-4 py-3">
        <div className="flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
            Recent Signals
          </span>
          <span className="rounded-full bg-blue-600/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-300">
            {sorted.length}
          </span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="rounded-md p-1 text-zinc-600 transition-colors hover:text-zinc-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="shrink-0 border-b border-[#27314a] px-3 py-2">
        <div className="flex items-center gap-2 rounded-lg bg-[#0a0f1e]/70 px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search signals…"
            className="flex-1 bg-transparent text-xs text-zinc-300 placeholder-zinc-700 outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-zinc-600 hover:text-zinc-400">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {sorted.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-zinc-700">
            No signals found
          </div>
        ) : (
          <ul className="divide-y divide-[#1c2436]">
            {sorted.map((r) => (
              <li key={r.id}>
                <div className="px-4 py-3">
                  {/* Top row: source + time */}
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: colors.status[r.status] }}
                    />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                      {r.source_name}
                    </span>
                    <span className="ml-auto shrink-0 text-[10px] tabular-nums text-zinc-700">
                      {timeAgo(r.reported_date)}
                    </span>
                  </div>

                  {/* Location */}
                  <p className="text-xs font-semibold leading-snug text-zinc-200">
                    {r.location_name}
                    {r.country && r.country !== "ZZ" && (
                      <span className="ml-1 font-normal text-zinc-600">· {r.country}</span>
                    )}
                  </p>

                  {/* Notes snippet */}
                  {r.notes && (
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-zinc-600">
                      {r.notes}
                    </p>
                  )}

                  {/* Tags */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${colors.status[r.status]}22`,
                        color:           colors.status[r.status],
                      }}
                    >
                      {statusLabels[r.status]}
                    </span>
                    <span className="text-[10px] tabular-nums text-zinc-700">
                      {r.case_count} case{r.case_count !== 1 ? "s" : ""}
                    </span>
                    {r.source_url && (
                      <a
                        href={r.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="ml-auto text-[10px] text-blue-500 hover:text-blue-400 hover:underline"
                      >
                        Source ↗
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
