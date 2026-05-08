"use client";

import { useState } from "react";
import { PlanCards }  from "@/components/marketing/plan-cards";
import { SiteFooter } from "@/components/layout/site-footer";

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  return (
    <>
      <section
        style={{
          padding:    "64px 64px",
          maxWidth:   1200,
          margin:     "0 auto",
          width:      "100%",
        }}
      >
        <div
          className="t-cap t-up text-center"
          style={{ color: "var(--text-secondary)" }}
        >
          Pricing
        </div>
        <h1
          className="t-display text-center"
          style={{ margin: "12px 0 16px", color: "var(--text-primary)" }}
        >
          One signal. Three tiers.
        </h1>
        <div
          className="text-center"
          style={{ fontSize: 15, marginBottom: 40, color: "var(--text-secondary)" }}
        >
          Cancel anytime. Free tier never expires.
        </div>

        {/* Toggle */}
        <div className="flex justify-center" style={{ marginBottom: 32 }}>
          <div
            className="flex items-center"
            style={{
              background:    "var(--bg-surface)",
              border:        "1px solid var(--border-default)",
              borderRadius:  9999,
              padding:       4,
            }}
          >
            <button
              onClick={() => setAnnual(false)}
              style={{
                padding:      "6px 16px",
                borderRadius: 9999,
                fontSize:     13,
                fontWeight:   500,
                background:   !annual ? "var(--bg-overlay)" : "transparent",
                color:        !annual ? "var(--text-primary)" : "var(--text-secondary)",
                border:       "none",
                cursor:       "pointer",
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className="flex items-center"
              style={{
                padding:      "6px 16px",
                borderRadius: 9999,
                fontSize:     13,
                fontWeight:   500,
                background:    annual ? "var(--bg-overlay)" : "transparent",
                color:         annual ? "var(--text-primary)" : "var(--text-secondary)",
                border:       "none",
                cursor:       "pointer",
                gap:          6,
              }}
            >
              Annual
              <span
                className="pill pill-info"
                style={{ marginLeft: 4, padding: "0 6px", fontSize: 9 }}
              >
                -17%
              </span>
            </button>
          </div>
        </div>

        <PlanCards annual={annual} />
      </section>
      <SiteFooter />
    </>
  );
}
