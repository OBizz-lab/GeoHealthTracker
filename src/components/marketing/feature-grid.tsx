"use client";

import { Globe2, FlaskConical, BellRing } from "lucide-react";
import { features } from "@/lib/copy";

const ICONS = {
  Globe2,
  FlaskConical,
  BellRing,
} as const;

// =============================================================================
// FeatureGrid — DESIGN_DOC §3 / marketing-screens.jsx
// "What it is" — 3 cards with icon + title + description
// =============================================================================

export function FeatureGrid() {
  return (
    <section style={{ padding: "64px 64px" }}>
      <div className="t-cap t-up" style={{ marginBottom: 8, color: "var(--text-secondary)" }}>
        What it is
      </div>
      <h2
        className="t-h1"
        style={{ marginBottom: 40, maxWidth: 600, color: "var(--text-primary)" }}
      >
        One verified view of where hantavirus is reported.
      </h2>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => {
          const Icon = ICONS[f.icon as keyof typeof ICONS] ?? Globe2;
          return (
            <div
              key={f.title}
              style={{
                background:    "var(--bg-surface)",
                border:        "1px solid var(--border-default)",
                borderRadius:  8,
                padding:       28,
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 40, height: 40,
                  borderRadius: 8,
                  background:   "var(--accent-muted)",
                  marginBottom: 16,
                }}
              >
                <Icon
                  className="h-5 w-5"
                  style={{ color: "var(--accent)" }}
                  strokeWidth={1.5}
                />
              </div>
              <div
                className="t-h3"
                style={{ marginBottom: 8, color: "var(--text-primary)" }}
              >
                {f.title}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                {f.description}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
