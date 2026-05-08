import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { supportPage } from "@/lib/copy";
import { PLACEHOLDERS } from "@/lib/legal-content";

export const metadata = {
  title: "Support — HantaVirusTrack",
  description:
    "HantaVirusTrack is free and independently operated. If it's useful to you, you can support the project with a tip on Buy Me a Coffee.",
};

export default function SupportPage() {
  const bmcConfigured = !PLACEHOLDERS.bmcHandle.startsWith("[");
  const bmcUrl = bmcConfigured
    ? `https://www.buymeacoffee.com/${PLACEHOLDERS.bmcHandle}`
    : "https://www.buymeacoffee.com";

  return (
    <>
      <section
        style={{
          padding: "64px 32px 96px",
          maxWidth: 960,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div className="t-cap t-up" style={{ color: "var(--text-secondary)" }}>
          {supportPage.eyebrow}
        </div>
        <h1
          className="t-display"
          style={{ margin: "12px 0 24px", color: "var(--text-primary)" }}
        >
          {supportPage.title}
        </h1>
        <p
          style={{
            fontSize: 16,
            lineHeight: "26px",
            color: "var(--text-secondary)",
            maxWidth: 680,
          }}
        >
          {supportPage.intro}
        </p>

        {/* BMC widget area */}
        <div
          style={{
            marginTop: 32,
            padding: 32,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: 12,
          }}
        >
          <h2 className="t-h2" style={{ marginBottom: 16, color: "var(--text-primary)" }}>
            {supportPage.bmcHeading}
          </h2>
          {bmcConfigured ? (
            <a
              href={bmcUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center"
              style={{
                padding: "12px 20px",
                background: "#FFDD00",
                color: "#0D0C22",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              ☕ Buy me a coffee
            </a>
          ) : (
            <>
              <p
                style={{
                  fontSize: 13,
                  lineHeight: "22px",
                  color: "var(--text-secondary)",
                  marginBottom: 12,
                }}
              >
                {supportPage.bmcMissing}
              </p>
              <a
                href={bmcUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13, color: "var(--accent)" }}
              >
                {supportPage.bmcFallback}
              </a>
            </>
          )}
        </div>

        {/* What this funds */}
        <div style={{ marginTop: 48 }}>
          <h2
            className="t-h2"
            style={{ marginBottom: 8, color: "var(--text-primary)" }}
          >
            {supportPage.fundsHeading}
          </h2>
          <p
            style={{
              fontSize: 14,
              lineHeight: "24px",
              color: "var(--text-secondary)",
              maxWidth: 680,
            }}
          >
            {supportPage.fundsBody}
          </p>
        </div>

        {/* Tax disclosure — must be prominent per FREE_MIGRATION §5 */}
        <div
          style={{
            marginTop: 32,
            padding: 20,
            borderRadius: 8,
            background: "rgba(255,184,77,0.04)",
            border: "1px solid var(--status-suspected)",
          }}
        >
          <div
            className="t-label"
            style={{ marginBottom: 6, color: "var(--text-primary)" }}
          >
            {supportPage.taxHeading}
          </div>
          <div
            style={{
              fontSize: 13,
              lineHeight: "22px",
              color: "var(--text-secondary)",
            }}
          >
            {supportPage.taxBody}
          </div>
        </div>

        {/* Other ways to help */}
        <div style={{ marginTop: 48 }}>
          <h2
            className="t-h2"
            style={{ marginBottom: 16, color: "var(--text-primary)" }}
          >
            {supportPage.helpHeading}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {supportPage.help.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block transition-colors"
                style={{
                  padding: 16,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 8,
                  textDecoration: "none",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    marginBottom: 4,
                  }}
                >
                  {item.label} →
                </div>
                <div
                  style={{
                    fontSize: 12,
                    lineHeight: "18px",
                    color: "var(--text-secondary)",
                  }}
                >
                  {item.description}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
