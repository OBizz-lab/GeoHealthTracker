"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { aboutFaq } from "@/lib/legal-content";

export function AboutFaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col" style={{ maxWidth: 720 }}>
      {aboutFaq.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={item.q}
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between"
              style={{
                padding: "16px 0",
                cursor: "pointer",
                color: "var(--text-primary)",
                background: "transparent",
                border: "none",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 500 }}>{item.q}</span>
              {isOpen ? (
                <Minus
                  className="h-4 w-4"
                  style={{ color: "var(--text-secondary)" }}
                />
              ) : (
                <Plus
                  className="h-4 w-4"
                  style={{ color: "var(--text-secondary)" }}
                />
              )}
            </button>
            {isOpen && (
              <div
                style={{
                  fontSize: 14,
                  lineHeight: "22px",
                  paddingBottom: 16,
                  color: "var(--text-secondary)",
                }}
              >
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
