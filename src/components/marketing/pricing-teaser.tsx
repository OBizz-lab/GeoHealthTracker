"use client";

import Link from "next/link";
import { PlanCards } from "@/components/marketing/plan-cards";

// =============================================================================
// PricingTeaser — landing page pricing section (compact)
// =============================================================================

export function PricingTeaser() {
  return (
    <section
      style={{
        padding:    "64px 64px",
        borderTop:  "1px solid var(--border-subtle)",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 32 }}
      >
        <div>
          <div className="t-cap t-up" style={{ marginBottom: 8, color: "var(--text-secondary)" }}>
            Pricing
          </div>
          <h2 className="t-h1" style={{ color: "var(--text-primary)" }}>
            Free for the public. Paid for the watching.
          </h2>
        </div>
        <Link
          href="/pricing"
          style={{ fontSize: 13, color: "var(--accent)" }}
        >
          See full pricing →
        </Link>
      </div>
      <PlanCards />
    </section>
  );
}
