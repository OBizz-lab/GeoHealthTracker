"use client";

import { sourcesStrip } from "@/lib/copy";

// =============================================================================
// SourcesStrip — flat list of source names (logo strip placeholder)
// =============================================================================

export function SourcesStrip() {
  return (
    <section
      style={{
        padding:    "40px 64px",
        borderTop:  "1px solid var(--border-subtle)",
      }}
    >
      <div
        className="t-cap t-up text-center"
        style={{ marginBottom: 24, color: "var(--text-secondary)" }}
      >
        Sources we pull from
      </div>
      <div
        className="flex flex-wrap items-center justify-around"
        style={{ gap: 32, opacity: 0.7 }}
      >
        {sourcesStrip.map((s) => (
          <span
            key={s}
            style={{
              fontSize:      13,
              fontWeight:    500,
              letterSpacing: "0.02em",
              color:         "var(--text-secondary)",
            }}
          >
            {s}
          </span>
        ))}
      </div>
    </section>
  );
}
