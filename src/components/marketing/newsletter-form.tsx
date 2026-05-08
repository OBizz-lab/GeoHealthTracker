"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { newsletter } from "@/lib/copy";

// =============================================================================
// NewsletterForm — CASL-compliant signup
// Express consent (unticked checkbox) + sender identification + unsubscribe
// guarantee per FREE_MIGRATION.md §9.
// =============================================================================

type FormState = "default" | "submitting" | "success" | "error" | "dup" | "consent";

export function NewsletterForm() {
  const [email, setEmail]     = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState]     = useState<FormState>("default");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState("error");
      return;
    }
    if (!consent) {
      setState("consent");
      return;
    }
    setState("submitting");
    try {
      const res = await fetch("/api/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, consent: true, consentTimestamp: new Date().toISOString() }),
      });
      if (res.status === 409) {
        setState("dup");
        return;
      }
      setState("success");
    } catch {
      setState("success"); // optimistic
    }
  }

  const errored  = state === "error" || state === "dup";
  const noConsent = state === "consent";

  return (
    <section
      id="newsletter"
      style={{
        padding:   "64px 64px",
        borderTop: "1px solid var(--border-subtle)",
        scrollMarginTop: 80,
      }}
    >
      <div
        className="text-center"
        style={{
          background:    "var(--bg-surface)",
          border:        "1px solid var(--border-default)",
          borderRadius:  8,
          padding:       40,
          maxWidth:      720,
          margin:        "0 auto",
        }}
      >
        <h2
          className="t-h2"
          style={{ marginBottom: 8, color: "var(--text-primary)" }}
        >
          {newsletter.title}
        </h2>
        <p
          style={{
            fontSize:    14,
            marginBottom: 24,
            color:       "var(--text-secondary)",
          }}
        >
          {newsletter.description}
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-stretch"
          style={{ gap: 12, maxWidth: 480, margin: "0 auto" }}
          aria-label="Subscribe to the newsletter"
        >
          <div className="flex items-center" style={{ gap: 8 }}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (state !== "default") setState("default"); }}
              placeholder={newsletter.placeholder}
              style={{
                flex:         1,
                padding:      "9px 12px",
                background:   "var(--bg-base)",
                border:       `1px solid ${errored ? "var(--status-confirmed)" : "var(--border-default)"}`,
                borderRadius: 8,
                color:        "var(--text-primary)",
                fontSize:     13,
                outline:      "none",
              }}
            />
            <button
              type="submit"
              disabled={state === "submitting" || state === "success"}
              className="inline-flex items-center justify-center transition-colors"
              style={{
                padding:      "9px 14px",
                background:   "var(--accent)",
                color:        "var(--text-inverse)",
                borderRadius: 8,
                fontSize:     13,
                fontWeight:   500,
                border:       "none",
                gap:          6,
                opacity:      state === "submitting" ? 0.7 : 1,
                cursor:       state === "submitting" ? "default" : "pointer",
              }}
            >
              {state === "submitting" && (
                <span
                  className="animate-spin rounded-full"
                  style={{
                    width: 12, height: 12,
                    border: "2px solid currentColor",
                    borderTopColor: "transparent",
                  }}
                />
              )}
              {state === "success"
                ? <><Check className="h-3.5 w-3.5" />Subscribed</>
                : state === "submitting"
                  ? "Subscribing…"
                  : newsletter.cta}
            </button>
          </div>

          {/* CASL express consent — must be unticked by default */}
          <label
            className="flex items-start text-left"
            style={{
              gap: 10,
              fontSize: 12,
              lineHeight: "18px",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "8px 4px 0",
            }}
          >
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (state === "consent") setState("default");
              }}
              style={{ marginTop: 2, accentColor: "var(--accent)" }}
              aria-describedby="newsletter-consent-help"
            />
            <span id="newsletter-consent-help">
              {newsletter.consentLabel}
            </span>
          </label>
        </form>

        {state === "error" && (
          <div
            style={{
              fontSize:    12,
              marginTop:   8,
              color:       "var(--status-confirmed)",
            }}
          >
            Please enter a valid email address.
          </div>
        )}
        {noConsent && (
          <div
            style={{
              fontSize:    12,
              marginTop:   8,
              color:       "var(--status-confirmed)",
            }}
          >
            Please consent to receive the newsletter before subscribing.
          </div>
        )}
        {state === "dup" && (
          <div
            style={{
              fontSize:    12,
              marginTop:   8,
              color:       "var(--status-suspected)",
            }}
          >
            You&apos;re already subscribed.
          </div>
        )}
        {state === "success" && (
          <div
            style={{
              fontSize:    12,
              marginTop:   8,
              color:       "var(--status-recovered)",
            }}
          >
            {newsletter.success}
          </div>
        )}

        <div
          style={{
            fontSize:  11,
            marginTop: 16,
            color:     "var(--text-tertiary)",
            lineHeight: "16px",
            maxWidth:  520,
            marginInline: "auto",
          }}
        >
          {newsletter.caslFooter}
        </div>
      </div>
    </section>
  );
}
