"use client";

import Link from "next/link";
import { useEffect } from "react";

// Static-export sites can't use Next.js redirects() — this client-side
// redirect plus a meta refresh in <head> covers all the cases where /pricing
// or /legal/* used to live.

export function RedirectPage({
  to,
  label,
  basePath = "/GeoHealthTracker",
}: {
  to: string;
  label: string;
  basePath?: string;
}) {
  const target = `${basePath}${to}`;

  useEffect(() => {
    window.location.replace(target);
  }, [target]);

  return (
    <>
      {/* Meta refresh as a no-JS fallback. */}
      <meta httpEquiv="refresh" content={`0; url=${target}`} />
      <section
        style={{
          padding: "120px 32px",
          maxWidth: 600,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h1
          className="t-h2"
          style={{ marginBottom: 12, color: "var(--text-primary)" }}
        >
          Redirecting…
        </h1>
        <p
          style={{
            fontSize: 14,
            lineHeight: "22px",
            color: "var(--text-secondary)",
            marginBottom: 16,
          }}
        >
          {label}
        </p>
        <Link
          href={to}
          style={{ fontSize: 13, color: "var(--accent)" }}
        >
          Continue to {to} →
        </Link>
      </section>
    </>
  );
}
