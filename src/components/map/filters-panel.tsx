"use client";

import { useState } from "react";
import { Filter, ChevronLeft } from "lucide-react";
import type { ReportStatus } from "@/lib/types";
import { colors, statusLabels } from "@/lib/design-tokens";

// =============================================================================
// FiltersPanel — DESIGN_DOC §5.7
// Left rail, 320px, collapsible. Sections:
//   Time range · Status · Strain · Source · Region preset · Source health
// =============================================================================

export type TimeRange = "7d" | "30d" | "90d" | "1y" | "all";
export type Strain   = "sin_nombre" | "andes" | "seoul" | "puumala" | "other";
export type Region   = "four_corners" | "continental_us" | "latin_america" | "europe" | "world";

const TIME_OPTIONS: { label: string; value: TimeRange }[] = [
  { label: "7d",   value: "7d"  },
  { label: "30d",  value: "30d" },
  { label: "90d",  value: "90d" },
  { label: "1y",   value: "1y"  },
  { label: "All",  value: "all" },
];

const STATUS_ORDER: ReportStatus[] = ["confirmed", "suspected", "fatal"];

const STRAIN_LABELS: Record<Strain, string> = {
  sin_nombre: "Sin Nombre",
  andes:      "Andes",
  seoul:      "Seoul",
  puumala:    "Puumala",
  other:      "Other / Unknown",
};

const REGION_LABELS: Record<Region, string> = {
  four_corners:   "Four Corners",
  continental_us: "Continental US",
  latin_america:  "Latin America",
  europe:         "Europe",
  world:          "World",
};

interface FiltersPanelProps {
  // Time
  timeRange:         TimeRange;
  onTimeRangeChange: (t: TimeRange) => void;
  // Status
  activeStatuses:    Set<ReportStatus>;
  onToggleStatus:    (s: ReportStatus) => void;
  // Strain
  activeStrains:     Set<Strain>;
  onToggleStrain:    (s: Strain) => void;
  // Source
  allSources:        string[];
  activeSources:     Set<string>;
  onToggleSource:    (slug: string) => void;
  // Region
  activeRegion:      Region | null;
  onRegionChange:    (r: Region | null) => void;
  // Source health (optional)
  sourceHealth?:     { slug: string; label: string; status: "green" | "yellow" | "red" }[];
  onClearAll?:       () => void;
}

function FilterChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center transition-colors"
      style={{
        gap:        6,
        padding:    "5px 10px",
        borderRadius: 9999,
        fontSize:   12,
        fontWeight: 500,
        cursor:     "pointer",
        background: active ? "var(--bg-overlay)" : "transparent",
        border:     `1px solid ${active ? "var(--border-strong)" : "var(--border-default)"}`,
        color:      active ? "var(--text-primary)" : "var(--text-tertiary)",
      }}
    >
      {color && (
        <span
          className="dot"
          style={{ background: color, width: 6, height: 6 }}
        />
      )}
      {label}
    </button>
  );
}

export function FiltersPanel(props: FiltersPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const {
    timeRange, onTimeRangeChange,
    activeStatuses, onToggleStatus,
    activeStrains, onToggleStrain,
    allSources, activeSources, onToggleSource,
    activeRegion, onRegionChange,
    sourceHealth, onClearAll,
  } = props;

  const activeCount =
    (timeRange !== "all" ? 1 : 0) +
    (activeStatuses.size < STATUS_ORDER.length ? 1 : 0) +
    (activeStrains.size > 0 ? 1 : 0) +
    (activeSources.size < allSources.length && allSources.length > 0 ? 1 : 0) +
    (activeRegion ? 1 : 0);

  // ─────────────────────────────────────────── Collapsed (rail)
  if (collapsed) {
    return (
      <div
        className="pointer-events-auto flex flex-col items-center"
        style={{
          width: 56,
          background:    "var(--bg-surface)",
          borderRight:   "1px solid var(--border-subtle)",
          padding:       "16px 0",
          gap:           16,
        }}
      >
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Expand filters"
        >
          <Filter className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────── Expanded
  return (
    <div
      className="pointer-events-auto flex flex-col"
      style={{
        width:         320,
        background:    "var(--bg-surface)",
        borderRight:   "1px solid var(--border-subtle)",
        height:        "100%",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center" style={{ gap: 8 }}>
          <Filter className="h-3.5 w-3.5" style={{ color: "var(--text-secondary)" }} />
          <span className="t-label">Filters</span>
          {activeCount > 0 && (
            <span className="pill pill-info">{activeCount} active</span>
          )}
        </div>
        {activeCount > 0 ? (
          <button
            onClick={onClearAll}
            style={{ fontSize: 12, color: "var(--accent)" }}
          >
            Clear all
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(true)}
            aria-label="Collapse"
          >
            <ChevronLeft className="h-3.5 w-3.5" style={{ color: "var(--text-tertiary)" }} />
          </button>
        )}
      </div>

      {/* Body */}
      <div
        className="flex-1 overflow-y-auto scroll-zinc"
        style={{ padding: 18 }}
      >
        <div className="flex flex-col" style={{ gap: 20 }}>
          {/* Time range */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <div className="t-cap t-up" style={{ color: "var(--text-secondary)" }}>
              Time range
            </div>
            <div
              className="flex"
              style={{
                background:   "var(--bg-base)",
                border:       "1px solid var(--border-default)",
                borderRadius: 8,
                padding:      3,
              }}
            >
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => onTimeRangeChange(t.value)}
                  className="text-center transition-colors"
                  style={{
                    flex:       1,
                    padding:    "6px 0",
                    fontSize:   12,
                    fontWeight: 500,
                    borderRadius: 6,
                    background: timeRange === t.value ? "var(--bg-overlay)" : "transparent",
                    color:      timeRange === t.value ? "var(--text-primary)" : "var(--text-secondary)",
                    cursor:     "pointer",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <div className="t-cap t-up" style={{ color: "var(--text-secondary)" }}>
              Status
            </div>
            <div className="flex flex-wrap" style={{ gap: 6 }}>
              {STATUS_ORDER.map((s) => (
                <FilterChip
                  key={s}
                  label={statusLabels[s]}
                  active={activeStatuses.has(s)}
                  color={colors.status[s]}
                  onClick={() => onToggleStatus(s)}
                />
              ))}
            </div>
          </div>

          {/* Strain */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <div className="t-cap t-up" style={{ color: "var(--text-secondary)" }}>
              Strain
            </div>
            <div className="flex flex-wrap" style={{ gap: 6 }}>
              {(Object.keys(STRAIN_LABELS) as Strain[]).map((s) => (
                <FilterChip
                  key={s}
                  label={STRAIN_LABELS[s]}
                  active={activeStrains.has(s)}
                  onClick={() => onToggleStrain(s)}
                />
              ))}
            </div>
          </div>

          {/* Source */}
          {allSources.length > 0 && (
            <div className="flex flex-col" style={{ gap: 8 }}>
              <div className="t-cap t-up" style={{ color: "var(--text-secondary)" }}>
                Source
              </div>
              <div className="flex flex-col" style={{ gap: 6 }}>
                {allSources.map((src) => {
                  const checked = activeSources.has(src);
                  return (
                    <label
                      key={src}
                      className="flex items-center cursor-pointer"
                      style={{ gap: 8, fontSize: 12 }}
                    >
                      <span
                        className="flex items-center justify-center"
                        style={{
                          width: 14, height: 14, borderRadius: 3,
                          background: checked ? "var(--accent)" : "transparent",
                          border:     checked ? "1px solid var(--accent)" : "1px solid var(--border-default)",
                        }}
                      >
                        {checked && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-inverse)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                      </span>
                      <span style={{ color: "var(--text-primary)" }}>{src}</span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleSource(src)}
                        style={{ display: "none" }}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Region preset */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <div className="t-cap t-up" style={{ color: "var(--text-secondary)" }}>
              Region
            </div>
            <div className="flex flex-wrap" style={{ gap: 6 }}>
              {(Object.keys(REGION_LABELS) as Region[]).map((r) => (
                <FilterChip
                  key={r}
                  label={REGION_LABELS[r]}
                  active={activeRegion === r}
                  onClick={() => onRegionChange(activeRegion === r ? null : r)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Source health footer */}
      {sourceHealth && sourceHealth.length > 0 && (
        <div
          className="flex flex-col"
          style={{
            padding:    14,
            borderTop:  "1px solid var(--border-subtle)",
            gap:        8,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="t-cap t-up" style={{ color: "var(--text-secondary)" }}>
              Source health
            </span>
            <a
              href="/sources"
              style={{ fontSize: 11, color: "var(--accent)" }}
            >
              Details →
            </a>
          </div>
          <div className="flex flex-wrap" style={{ gap: 8 }}>
            {sourceHealth.map((h) => (
              <div key={h.slug} className="flex items-center" style={{ gap: 4 }}>
                <span className={`dot dot-${h.status}`} />
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                  {h.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
