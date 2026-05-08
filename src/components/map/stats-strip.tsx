"use client";

import { useEffect, useRef, useState } from "react";

// =============================================================================
// StatsStrip — DESIGN_DOC §5.6
// Top-center floating panel: Total cases · Fatalities · Active regions ·
// Mentions · Last updated.
//
// Self-sizing: a ResizeObserver measures the actual container width and
// switches between three layouts:
//   • full      ≥ 540px  — single row with dividers, design-spec sizing
//   • medium    420–539  — single row, no dividers, slightly tighter
//   • compact   < 420px  — 2-row grid (mobile / very tight space)
//
// The strip never decides compact based on drawer-open state — it decides on
// actual rendered width, so a wide desktop with a drawer open stays full-size.
// =============================================================================

interface StatsStripProps {
  totalCases:        number;
  fatalities:        number;
  activeRegions:     number;
  lastUpdatedLabel:  string;
  delta24h?:         number;
  mentions?:         number;
}

type Layout = "full" | "medium" | "compact";

function Stat({
  label,
  value,
  delta,
  warn = false,
  size = "lg",
}: {
  label: string;
  value: string;
  delta?: string;
  warn?: boolean;
  size?: "lg" | "md" | "sm";
}) {
  const valueSize = size === "lg" ? 24 : size === "md" ? 20 : 16;
  const valueLine = size === "lg" ? "32px" : size === "md" ? "26px" : "20px";
  const labelSize = size === "lg" ? 12 : 11;
  return (
    <div className="flex flex-col" style={{ gap: size === "sm" ? 1 : 4 }}>
      <div
        className="t-cap t-up"
        style={{ color: "var(--text-secondary)", fontSize: labelSize }}
      >
        {label}
      </div>
      <div
        className="num"
        style={{
          fontSize:      valueSize,
          lineHeight:    valueLine,
          fontWeight:    600,
          letterSpacing: "-0.005em",
          color:         warn ? "var(--status-suspected)" : "var(--text-primary)",
        }}
      >
        {value}
      </div>
      {delta && size !== "sm" && (
        <div className="t-cap" style={{ color: "var(--status-confirmed)" }}>
          {delta}
        </div>
      )}
    </div>
  );
}

const Divider = () => (
  <div style={{ width: 1, height: 36, background: "var(--border-subtle)" }} />
);

export function StatsStrip({
  totalCases,
  fatalities,
  activeRegions,
  lastUpdatedLabel,
  delta24h,
  mentions,
}: StatsStripProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [layout, setLayout] = useState<Layout>("full");

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w < 420)        setLayout("compact");
        else if (w < 540)   setLayout("medium");
        else                setLayout("full");
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const wrapper: React.CSSProperties = {
    background:           "var(--map-overlay-bg)",
    backdropFilter:       "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border:               "1px solid var(--border-subtle)",
    borderRadius:         12,
    boxShadow:            "0 4px 16px rgba(0,0,0,0.4)",
    width:                "100%",
    maxWidth:             720,
  };

  // ── Compact: 4-up grid (mobile / very tight) ────────────────────────────
  if (layout === "compact") {
    return (
      <div ref={ref} className="grid"
        style={{
          ...wrapper,
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          padding: "8px 10px",
          gap: 10,
        }}
      >
        <Stat size="sm" label="Cases"    value={totalCases.toLocaleString()} />
        <Stat size="sm" label="Fatal"    value={fatalities.toLocaleString()} />
        <Stat size="sm" label="Regions"  value={activeRegions.toLocaleString()} />
        <Stat size="sm"
              label={typeof mentions === "number" ? "Mentions" : "Updated"}
              value={typeof mentions === "number" ? mentions.toLocaleString() : lastUpdatedLabel} />
      </div>
    );
  }

  // ── Medium: single row, slightly tighter, no dividers ───────────────────
  if (layout === "medium") {
    return (
      <div ref={ref} className="flex items-center"
        style={{
          ...wrapper,
          padding: "10px 14px",
          gap: 18,
          minWidth: 0,
        }}
      >
        <Stat size="md" label="Cases"     value={totalCases.toLocaleString()} />
        <Stat size="md" label="Fatalities" value={fatalities.toLocaleString()} />
        <Stat size="md" label="Regions"    value={activeRegions.toLocaleString()} />
        {typeof mentions === "number" && (
          <Stat size="md" label="Mentions" value={mentions.toLocaleString()} />
        )}
        <Stat size="md" label="Updated"    value={lastUpdatedLabel} />
      </div>
    );
  }

  // ── Full: single row with dividers, design-spec sizing ──────────────────
  return (
    <div ref={ref} className="flex items-center"
      style={{
        ...wrapper,
        padding: "12px 16px",
        gap: 24,
        minWidth: 0,
      }}
    >
      <Stat
        label="Total cases"
        value={totalCases.toLocaleString()}
        delta={delta24h && delta24h > 0 ? `+${delta24h} in last 24h` : undefined}
      />
      <Divider />
      <Stat label="Fatalities"      value={fatalities.toLocaleString()} />
      <Divider />
      <Stat label="Active regions"  value={activeRegions.toLocaleString()} />
      {typeof mentions === "number" && (
        <>
          <Divider />
          <Stat label="Mentions"     value={mentions.toLocaleString()} />
        </>
      )}
      <Divider />
      <Stat label="Last updated"     value={lastUpdatedLabel} />
    </div>
  );
}
