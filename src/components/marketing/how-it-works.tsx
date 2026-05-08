"use client";

import { howItWorks } from "@/lib/copy";

// =============================================================================
// HowItWorks — 4-step process strip
// =============================================================================

export function HowItWorks() {
  return (
    <section
      style={{
        padding:    "64px 64px",
        borderTop:  "1px solid var(--border-subtle)",
      }}
    >
      <div className="t-cap t-up" style={{ marginBottom: 8, color: "var(--text-secondary)" }}>
        How it works
      </div>
      <h2 className="t-h1" style={{ marginBottom: 40, color: "var(--text-primary)" }}>
        From source to map in four steps.
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {howItWorks.map((s) => (
          <div key={s.n}>
            <div
              className="t-mono"
              style={{ fontSize: 13, marginBottom: 8, color: "var(--text-secondary)" }}
            >
              {s.n}
            </div>
            <div
              className="t-h3"
              style={{ marginBottom: 6, color: "var(--text-primary)" }}
            >
              {s.title}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              {s.description}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
