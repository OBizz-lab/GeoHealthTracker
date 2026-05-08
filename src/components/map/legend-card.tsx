"use client";

import { Check, X } from "lucide-react";
import type { ReportStatus } from "@/lib/types";
import { colors, statusLabels } from "@/lib/design-tokens";

// =============================================================================
// LegendCard — DESIGN_DOC §5.9
// Bottom-left, compact card. Three rows for status with toggle, plus a cluster
// scale row.
// =============================================================================

const LEGEND_STATUSES: ReportStatus[] = ["confirmed", "suspected", "fatal"];

interface LegendCardProps {
  activeStatuses: Set<ReportStatus>;
  onToggle:       (s: ReportStatus) => void;
}

export function LegendCard({ activeStatuses, onToggle }: LegendCardProps) {
  return (
    <div
      className="pointer-events-auto"
      style={{
        background:      "var(--map-overlay-bg)",
        backdropFilter:  "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border:          "1px solid var(--border-subtle)",
        borderRadius:    12,
        padding:         14,
        minWidth:        200,
      }}
    >
      <div
        className="t-cap t-up"
        style={{ marginBottom: 10, color: "var(--text-secondary)" }}
      >
        Legend
      </div>
      <div className="flex flex-col" style={{ gap: 8 }}>
        {LEGEND_STATUSES.map((s) => {
          const off = !activeStatuses.has(s);
          return (
            <button
              key={s}
              onClick={() => onToggle(s)}
              className="flex items-center w-full"
              style={{
                gap:     8,
                opacity: off ? 0.4 : 1,
                cursor:  "pointer",
              }}
            >
              <span
                className="dot"
                style={{ background: colors.status[s], width: 10, height: 10 }}
              />
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>
                {statusLabels[s]}
              </span>
              <span style={{ marginLeft: "auto" }}>
                {off
                  ? <X className="h-3 w-3" style={{ color: "var(--text-tertiary)" }} />
                  : <Check className="h-3 w-3" style={{ color: "var(--text-tertiary)" }} />}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ height: 1, background: "var(--border-subtle)", margin: "12px 0" }} />

      <div className="flex items-center" style={{ gap: 8 }}>
        <div
          style={{
            width: 14, height: 14, borderRadius: "50%",
            background: colors.cluster.low,
          }}
        />
        <div
          style={{
            width: 18, height: 18, borderRadius: "50%",
            background: colors.cluster.med,
          }}
        />
        <div
          style={{
            width: 22, height: 22, borderRadius: "50%",
            background: colors.cluster.high,
          }}
        />
        <span
          className="t-cap"
          style={{ color: "var(--text-secondary)" }}
        >
          cluster size
        </span>
      </div>
    </div>
  );
}
