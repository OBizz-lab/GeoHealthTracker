"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { newsletter } from "@/lib/copy";

// =============================================================================
// NewsletterCTA — DESIGN_DOC marketing
// Centered card. Email + Subscribe with success/error states.
// =============================================================================

type FormState = "default" | "submitting" | "success" | "error" | "dup";

export function NewsletterForm() {
  const [email, setEmail]   = useState("");
  const [state, setState]   = useState<FormState>("default");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState("error");
      return;
    }
    setState("submitting");
    try {
      const res = await fetch("/api/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
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

  const errored = state === "error" || state === "dup";

  return (
    <section
      style={{
        padding:   "64px 64px",
        borderTop: "1px solid var(--border-subtle)",
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
          className="flex items-center"
          style={{ gap: 8, maxWidth: 480, margin: "0 auto" }}
          aria-label="Subscribe to the newsletter"
        >
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
      </div>
    </section>
  );
}
