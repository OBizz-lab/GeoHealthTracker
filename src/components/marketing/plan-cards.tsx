"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { pricingTiers } from "@/lib/copy";

// =============================================================================
// PlanCards — 3-up pricing cards (Free / Watch / Pro)
// Watch is highlighted as "Most popular"
// =============================================================================

interface PlanCardsProps {
  annual?: boolean;
  current?: string;
  popularId?: string;
}

export function PlanCards({
  annual = false,
  current = undefined,
  popularId = "watch",
}: PlanCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {pricingTiers.map((p) => {
        const isPop  = popularId === p.id;
        const isCur  = current === p.id;
        const price  = annual ? p.price.annual  : p.price.monthly;
        const save   = annual ? p.save?.annual  : p.save?.monthly;
        return (
          <div
            key={p.id}
            className="relative"
            style={{
              background:    "var(--bg-surface)",
              border:        `1px solid ${
                isPop
                  ? "var(--accent)"
                  : isCur
                    ? "var(--status-recovered)"
                    : "var(--border-default)"
              }`,
              borderRadius:  8,
              padding:       24,
              boxShadow:     isPop
                ? "0 0 0 1px var(--accent), 0 0 24px rgba(91,192,235,0.15)"
                : "none",
            }}
          >
            {isPop && (
              <div
                style={{
                  position:     "absolute",
                  top:          -10,
                  left:         24,
                  padding:      "2px 10px",
                  background:   "var(--accent)",
                  color:        "var(--text-inverse)",
                  borderRadius: 9999,
                  fontSize:     11,
                  fontWeight:   600,
                }}
              >
                Most popular
              </div>
            )}
            {isCur && (
              <div
                style={{
                  position:     "absolute",
                  top:          -10,
                  left:         24,
                  padding:      "2px 10px",
                  background:   "var(--status-recovered)",
                  color:        "var(--text-inverse)",
                  borderRadius: 9999,
                  fontSize:     11,
                  fontWeight:   600,
                }}
              >
                Current plan
              </div>
            )}

            <div
              className="t-h3"
              style={{ marginBottom: 4, color: "var(--text-primary)" }}
            >
              {p.name}
            </div>
            <div
              style={{
                fontSize:    13,
                marginBottom: 16,
                minHeight:    40,
                color:       "var(--text-secondary)",
              }}
            >
              {p.description}
            </div>

            <div
              className="flex items-baseline"
              style={{ marginBottom: 20, gap: 8 }}
            >
              <span
                className="num"
                style={{
                  fontSize:      32,
                  fontWeight:    700,
                  letterSpacing: "-0.02em",
                  color:         "var(--text-primary)",
                }}
              >
                {price}
              </span>
              {save && <span className="pill pill-info">{save}</span>}
            </div>

            <Link
              href={p.href}
              className="inline-flex w-full items-center justify-center transition-colors"
              style={{
                padding:      "10px 14px",
                borderRadius: 8,
                fontSize:     13,
                fontWeight:   500,
                background:   isPop ? "var(--accent)"        : "var(--bg-elevated)",
                color:        isPop ? "var(--text-inverse)"   : "var(--text-primary)",
                border:       isPop ? "none"                  : "1px solid var(--border-default)",
                pointerEvents: isCur ? "none" : "auto",
                opacity:       isCur ? 0.5 : 1,
              }}
            >
              {isCur ? "Current plan" : p.cta}
            </Link>

            <div
              className="flex flex-col"
              style={{ marginTop: 20, gap: 8 }}
            >
              {p.features.map((f) => (
                <div
                  key={f}
                  className="flex items-center"
                  style={{ gap: 8, fontSize: 13, color: "var(--text-primary)" }}
                >
                  <Check
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: "var(--status-recovered)" }}
                  />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
