"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "hvt:disclaimer-acknowledged";

export function DisclaimerModal() {
  const [acknowledged, setAcknowledged] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      setAcknowledged(v === "true");
    } catch {
      setAcknowledged(true);
    }
  }, []);

  if (acknowledged !== false) return null;

  function handleAcknowledge() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {}
    setAcknowledged(true);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hvt-disclaimer-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 16,
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: "100%",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: 12,
          padding: 28,
          boxShadow: "0 24px 48px rgba(0,0,0,0.45)",
        }}
      >
        <h2
          id="hvt-disclaimer-title"
          className="t-h2"
          style={{ marginBottom: 12, color: "var(--text-primary)" }}
        >
          Before you continue.
        </h2>
        <p
          style={{
            fontSize: 14,
            lineHeight: "22px",
            color: "var(--text-secondary)",
            marginBottom: 12,
          }}
        >
          HantaVirusTrack is an informational tool, not medical advice. Case
          data may be delayed, incomplete, or incorrect. If you have symptoms
          or possible exposure, contact your healthcare provider or your local
          public health authority directly.
        </p>
        <p
          style={{
            fontSize: 13,
            lineHeight: "20px",
            color: "var(--text-tertiary)",
            marginBottom: 24,
          }}
        >
          By continuing, you agree to our{" "}
          <Link
            href="/about#disclaimer"
            style={{ color: "var(--accent)" }}
          >
            Disclaimer
          </Link>{" "}
          and{" "}
          <Link href="/about#terms" style={{ color: "var(--accent)" }}>
            Terms
          </Link>
          .
        </p>
        <div className="flex items-center" style={{ gap: 12 }}>
          <button
            type="button"
            onClick={handleAcknowledge}
            style={{
              padding: "10px 16px",
              background: "var(--accent)",
              color: "var(--text-inverse)",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            I understand
          </button>
          <Link
            href="/about#disclaimer"
            onClick={handleAcknowledge}
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            Read the full disclaimer →
          </Link>
        </div>
      </div>
    </div>
  );
}
