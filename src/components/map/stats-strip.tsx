"use client";

// =============================================================================
// StatsStrip — DESIGN_DOC §5.6
// Top-center floating panel: Total cases · Fatalities · Active regions · Last updated
// =============================================================================

interface StatsStripProps {
  totalCases:        number;
  fatalities:        number;
  activeRegions:     number;
  lastUpdatedLabel:  string; // e.g., "12m ago"
  delta24h?:         number; // +N in last 24h
}

function Stat({
  label,
  value,
  delta,
  warn = false,
}: {
  label: string;
  value: string;
  delta?: string;
  warn?: boolean;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 4 }}>
      <div
        className="t-cap t-up"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </div>
      <div
        className="t-h2 num"
        style={{ color: warn ? "var(--status-suspected)" : "var(--text-primary)" }}
      >
        {value}
      </div>
      {delta && (
        <div className="t-cap" style={{ color: "var(--status-confirmed)" }}>
          {delta}
        </div>
      )}
    </div>
  );
}

export function StatsStrip({
  totalCases,
  fatalities,
  activeRegions,
  lastUpdatedLabel,
  delta24h,
}: StatsStripProps) {
  return (
    <div
      className="flex items-center"
      style={{
        background:        "var(--map-overlay-bg)",
        backdropFilter:    "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border:            "1px solid var(--border-subtle)",
        borderRadius:      12,
        padding:           "12px 16px",
        gap:               24,
        minWidth:          480,
        boxShadow:         "0 4px 16px rgba(0,0,0,0.4)",
      }}
    >
      <Stat
        label="Total cases"
        value={totalCases.toLocaleString()}
        delta={delta24h && delta24h > 0 ? `+${delta24h} in last 24h` : undefined}
      />
      <div style={{ width: 1, height: 36, background: "var(--border-subtle)" }} />
      <Stat label="Fatalities" value={fatalities.toLocaleString()} />
      <div style={{ width: 1, height: 36, background: "var(--border-subtle)" }} />
      <Stat label="Active regions" value={activeRegions.toLocaleString()} />
      <div style={{ width: 1, height: 36, background: "var(--border-subtle)" }} />
      <Stat label="Last updated" value={lastUpdatedLabel} />
    </div>
  );
}
