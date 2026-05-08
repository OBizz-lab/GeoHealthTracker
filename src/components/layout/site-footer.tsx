import Link from "next/link";
import { MapPin } from "lucide-react";

import { brand, footer } from "@/lib/copy";

// =============================================================================
// SiteFooter — DESIGN_DOC §4.3
// 3-column grid (Product / Data / Company) + bottom strip
// =============================================================================

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer
      style={{
        padding: compact ? "24px 32px" : "40px 64px",
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      {!compact && (
        <div
          className="grid gap-8 pb-6 sm:grid-cols-2 lg:grid-cols-4"
          style={{ marginBottom: 8 }}
        >
          <div>
            <Link
              href="/"
              className="flex items-center gap-1.5 font-semibold"
              style={{ fontSize: 15, marginBottom: 12 }}
            >
              <MapPin
                className="h-3.5 w-3.5"
                strokeWidth={1.75}
                style={{ color: "var(--accent)" }}
              />
              <span>{brand.name}</span>
            </Link>
            <p
              style={{
                fontSize: 12,
                lineHeight: "18px",
                color: "var(--text-secondary)",
                maxWidth: 280,
              }}
            >
              Live, sourced hantavirus surveillance from official health
              agencies worldwide.
            </p>
          </div>

          {footer.columns.map((col) => (
            <div key={col.heading} className="flex flex-col gap-2">
              <div
                className="t-cap t-up"
                style={{ marginBottom: 4, color: "var(--text-secondary)" }}
              >
                {col.heading}
              </div>
              {col.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  style={{
                    fontSize: 13,
                    color: "var(--text-secondary)",
                  }}
                  className="transition-colors hover:text-[color:var(--text-primary)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          height: 1,
          background: "var(--border-subtle)",
        }}
      />
      <div
        className="flex flex-col items-start justify-between gap-2 pt-4 sm:flex-row sm:items-center"
        style={{ fontSize: 11, color: "var(--text-tertiary)" }}
      >
        <span>{footer.caption}</span>
        <span>© Mapbox · © OpenStreetMap</span>
      </div>
    </footer>
  );
}
