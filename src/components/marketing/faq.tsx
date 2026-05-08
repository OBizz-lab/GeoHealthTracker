"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { faqItems } from "@/lib/copy";

// =============================================================================
// FAQ — accordion (one open at a time)
// =============================================================================

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      style={{
        padding:    "64px 64px",
        borderTop:  "1px solid var(--border-subtle)",
      }}
    >
      <div className="t-cap t-up" style={{ marginBottom: 8, color: "var(--text-secondary)" }}>
        FAQ
      </div>
      <h2
        className="t-h1"
        style={{ marginBottom: 32, color: "var(--text-primary)" }}
      >
        Common questions.
      </h2>

      <div className="flex flex-col" style={{ maxWidth: 760 }}>
        {faqItems.map((it, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={it.q}
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between"
                style={{
                  padding: "20px 0",
                  cursor:  "pointer",
                  color:   "var(--text-primary)",
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 500, textAlign: "left" }}>
                  {it.q}
                </span>
                {isOpen
                  ? <Minus className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
                  : <Plus  className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />}
              </button>
              {isOpen && (
                <div
                  style={{
                    fontSize:   14,
                    lineHeight: "22px",
                    paddingBottom: 20,
                    maxWidth:   600,
                    color:      "var(--text-secondary)",
                  }}
                >
                  {it.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
