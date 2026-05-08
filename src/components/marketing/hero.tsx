"use client";

import Link from "next/link";
import { hero } from "@/lib/copy";

// =============================================================================
// Hero — DESIGN_DOC §3 + map-screens.jsx
// 540px tall, map preview behind a gradient, badge + display title + subtitle + 2 CTAs
// =============================================================================

export function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ height: 540, borderBottom: "1px solid var(--border-subtle)" }}
    >
      {/* Mock map background */}
      <div
        className="absolute inset-0 ghx-grid-pattern"
        aria-hidden
        style={{
          opacity: 0.6,
          background:
            "radial-gradient(ellipse at 30% 40%, rgba(91, 192, 235, 0.08) 0%, transparent 60%)," +
            "radial-gradient(ellipse at 70% 60%, rgba(201, 42, 79, 0.10) 0%, transparent 50%)," +
            "linear-gradient(180deg, #07091a 0%, #0a0e1a 100%)",
        }}
      />

      {/* Mock cluster bubbles */}
      <div className="absolute" style={{ left: "38%", top: "48%" }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "var(--map-cluster-med)",
            border: "2px solid rgba(255,255,255,0.18)",
            boxShadow: "0 0 24px rgba(255, 107, 107, 0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 12, fontWeight: 600,
          }}
        >
          6
        </div>
      </div>
      <div className="absolute" style={{ left: "77%", top: "26%" }}>
        <div
          style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "var(--map-cluster-high)",
            border: "2px solid rgba(255,255,255,0.18)",
            boxShadow: "0 0 24px rgba(201, 42, 79, 0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 14, fontWeight: 600,
          }}
        >
          23
        </div>
      </div>

      {/* Single markers */}
      {[
        { x: "30%", y: "60%", color: "var(--status-confirmed)" },
        { x: "55%", y: "35%", color: "var(--status-suspected)" },
        { x: "80%", y: "70%", color: "var(--status-fatal)" },
        { x: "20%", y: "30%", color: "var(--status-confirmed)" },
        { x: "65%", y: "55%", color: "var(--status-confirmed)" },
      ].map((m, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: m.x, top: m.y,
            width: 12, height: 12, borderRadius: "50%",
            background: m.color,
            border: "1.5px solid rgba(255,255,255,0.5)",
            boxShadow: `0 0 12px ${m.color}55`,
          }}
        />
      ))}

      {/* Gradient over content */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, rgba(10,14,26,0.4) 0%, rgba(10,14,26,0.85) 70%, var(--bg-base) 100%)",
        }}
      />

      {/* Content */}
      <div
        className="relative flex h-full flex-col items-center justify-center text-center"
        style={{ padding: "0 24px", maxWidth: 800, margin: "0 auto" }}
      >
        {/* Live badge */}
        <div
          className="flex items-center"
          style={{
            gap:          8,
            padding:      "4px 12px",
            background:   "var(--bg-overlay)",
            border:       "1px solid var(--border-default)",
            borderRadius: 9999,
            fontSize:     12,
            color:        "var(--text-primary)",
            marginBottom: 24,
          }}
        >
          <span className="dot dot-green" />
          <span>{hero.badge}</span>
        </div>

        {/* Title */}
        <h1
          className="t-display"
          style={{ marginBottom: 16, maxWidth: 720, color: "var(--text-primary)" }}
        >
          {hero.title}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize:     17,
            lineHeight:   "26px",
            maxWidth:     600,
            marginBottom: 32,
            color:        "var(--text-secondary)",
          }}
        >
          {hero.subtitle}
        </p>

        {/* CTAs */}
        <div className="flex items-center" style={{ gap: 12 }}>
          <Link
            href={hero.ctaPrimary.href}
            className="inline-flex items-center justify-center transition-colors"
            style={{
              padding:      "12px 20px",
              borderRadius: 8,
              background:   "var(--accent)",
              color:        "var(--text-inverse)",
              fontSize:     14,
              fontWeight:   600,
            }}
          >
            {hero.ctaPrimary.label}
          </Link>
          <Link
            href={hero.ctaSecondary.href}
            className="inline-flex items-center justify-center transition-colors"
            style={{
              padding:      "12px 20px",
              borderRadius: 8,
              background:   "var(--bg-surface)",
              border:       "1px solid var(--border-default)",
              color:        "var(--text-primary)",
              fontSize:     14,
              fontWeight:   500,
            }}
          >
            {hero.ctaSecondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
