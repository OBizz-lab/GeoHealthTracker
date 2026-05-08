"use client";

import { statsBand } from "@/lib/copy";

// =============================================================================
// StatsBand — landing page stat strip (4-up large numbers)
// =============================================================================

export function StatsBand() {
  return (
    <section
      style={{
        padding:       "48px 64px",
        borderBottom:  "1px solid var(--border-subtle)",
      }}
    >
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {statsBand.map((s) => (
          <div key={s.label} className="flex flex-col" style={{ gap: 4 }}>
            <div className="t-cap t-up" style={{ color: "var(--text-secondary)" }}>
              {s.label}
            </div>
            <div
              className="num"
              style={{
                fontSize:      40,
                fontWeight:    600,
                letterSpacing: "-0.02em",
                color:         "var(--text-primary)",
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
