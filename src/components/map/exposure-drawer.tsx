"use client";

import { Eye, X } from "lucide-react";

import type { CountryExposure } from "@/components/map/map-view";

interface ExposureDrawerProps {
  country: CountryExposure | null;
  onClose: () => void;
}

// =============================================================================
// ExposureDrawer
// Opens when the user clicks an exposure-follow-up country marker. Surfaces
// the row's notes — explicitly framed as "NOT a confirmed case" surveillance
// follow-up — and links to the source. Visually leans on a neutral teal so
// it can't be mistaken for a confirmed-case panel.
// =============================================================================

export function ExposureDrawer({ country, onClose }: ExposureDrawerProps) {
  if (!country) return null;

  const reports = country.reports;
  const accent = "#7BA0A8";

  return (
    <aside
      role="dialog"
      aria-label={`Exposure follow-up for ${country.iso}`}
      className="flex h-full w-full flex-col"
      style={{
        background:           "var(--bg-surface)",
        borderLeft:           "1px solid var(--border-subtle)",
        borderTopLeftRadius:  16,
        borderTopRightRadius: 16,
        boxShadow:            "0 -8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          padding:      "14px 18px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center" style={{ gap: 8 }}>
          <Eye className="h-3.5 w-3.5" style={{ color: accent }} />
          <span className="t-cap t-up" style={{ color: "var(--text-secondary)" }}>
            Surveillance follow-up
          </span>
        </div>
        <button onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" style={{ color: "var(--text-tertiary)" }} />
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div>
          <div
            className="t-h2"
            style={{ color: "var(--text-primary)", marginBottom: 4 }}
          >
            {reports[0]?.location_name ?? country.iso}
          </div>
          <div
            className="t-cap"
            style={{ color: accent, fontWeight: 500 }}
          >
            Not a confirmed case · contact-tracing only
          </div>
        </div>

        <div
          style={{
            background:   "rgba(123,160,168,0.08)",
            border:       `1px solid ${accent}33`,
            borderRadius: 10,
            padding:      "12px 14px",
            fontSize:     13,
            lineHeight:   "20px",
            color:        "var(--text-secondary)",
          }}
        >
          A person who was in close contact with a confirmed cluster case has
          returned to this country. Local public-health authorities are
          conducting <strong style={{ color: "var(--text-primary)" }}>surveillance follow-up</strong>{" "}
          — monitoring for symptoms during the incubation window. Inclusion
          here means a country has a tracked contact, not a confirmed case.
        </div>

        {reports.map((r) => (
          <div key={r.id}>
            <div
              className="t-cap t-up"
              style={{ color: "var(--text-tertiary)", marginBottom: 6 }}
            >
              Notes
            </div>
            <div
              style={{
                fontSize:   13,
                lineHeight: "20px",
                color:      "var(--text-secondary)",
              }}
            >
              {r.notes}
            </div>
            {r.source_url && (
              <a
                href={r.source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:    "inline-block",
                  marginTop:  10,
                  fontSize:   12,
                  fontWeight: 500,
                  color:      accent,
                }}
              >
                Source: {r.source_name} ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
