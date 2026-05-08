"use client";

import { ExternalLink, Radio, X } from "lucide-react";
import { format, parseISO } from "date-fns";

import type { CountryMentions } from "@/components/map/map-view";

interface MentionsDrawerProps {
  country: CountryMentions | null;
  onClose: () => void;
}

// =============================================================================
// MentionsDrawer — DESIGN_DOC §5.8 / SOCIAL_INTEGRATION variant
// Right-side drawer (380px) that opens when a per-country news marker is
// clicked. Lists the news outlets reporting on hantavirus in that country.
// Visually leans on the cyan accent (consistent with mention-marker styling).
// =============================================================================

export function MentionsDrawer({ country, onClose }: MentionsDrawerProps) {
  if (!country) return null;

  const reportsByDateDesc = [...country.reports].sort(
    (a, b) =>
      new Date(b.reported_date).getTime() - new Date(a.reported_date).getTime(),
  );

  return (
    <aside
      role="dialog"
      aria-label={`News mentions for ${country.iso}`}
      className="flex h-full w-full flex-col"
      style={{
        background:           "var(--bg-surface)",
        borderLeft:           "1px solid var(--border-subtle)",
        borderTopLeftRadius:  16,
        borderTopRightRadius: 16,
        boxShadow:            "0 -8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{
          padding:      "14px 18px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center" style={{ gap: 8 }}>
          <Radio className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
          <span className="t-cap t-up" style={{ color: "var(--text-secondary)" }}>
            News mentions
          </span>
        </div>
        <button onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" style={{ color: "var(--text-tertiary)" }} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto scroll-zinc" style={{ padding: 20 }}>
        <div className="flex flex-col" style={{ gap: 16 }}>
          {/* Country header */}
          <div className="flex flex-col" style={{ gap: 4 }}>
            <h2 className="t-h2" style={{ color: "var(--text-primary)" }}>
              {country.iso}
            </h2>
            <p className="t-cap" style={{ color: "var(--text-secondary)" }}>
              {country.count} news article{country.count === 1 ? "" : "s"} reporting
              on hantavirus · no confirmed cases yet
            </p>
          </div>

          {/* Disclaimer */}
          <div
            style={{
              padding:      10,
              borderRadius: 8,
              background:   "rgba(91,192,235,0.08)",
              border:       "1px solid rgba(91,192,235,0.30)",
              fontSize:     11,
              lineHeight:   "16px",
              color:        "var(--text-secondary)",
            }}
          >
            These are news reports — not verified case data. Country fill is
            reserved for confirmed cases from official health authorities.
          </div>

          {/* Article list */}
          <ul
            className="flex flex-col"
            style={{ gap: 1 }}
          >
            {reportsByDateDesc.map((r) => {
              const dateLabel = (() => {
                try { return format(parseISO(r.reported_date), "MMM d, yyyy"); }
                catch { return r.reported_date; }
              })();
              const domain = (() => {
                try { return new URL(r.source_url ?? "").hostname.replace(/^www\./, ""); }
                catch { return null; }
              })();
              return (
                <li key={r.id}>
                  <a
                    href={r.source_url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start transition-colors"
                    style={{
                      gap:           12,
                      padding:       "12px 0",
                      borderBottom:  "1px solid var(--border-subtle)",
                      color:         "var(--text-primary)",
                    }}
                  >
                    {/* Logo placeholder (initials) */}
                    <span
                      className="flex shrink-0 items-center justify-center"
                      style={{
                        width:          40,
                        height:         40,
                        borderRadius:   3,
                        background:     "var(--accent-muted)",
                        color:          "var(--accent)",
                        fontSize:       11,
                        fontWeight:     700,
                      }}
                    >
                      {(r.source_name ?? "?").slice(0, 2).toUpperCase()}
                    </span>

                    <div className="flex flex-1 flex-col" style={{ minWidth: 0, gap: 2 }}>
                      <div className="flex items-center" style={{ gap: 8 }}>
                        <span
                          className="t-cap t-up"
                          style={{
                            color:        "var(--text-secondary)",
                            overflow:     "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace:   "nowrap",
                          }}
                        >
                          {r.source_name}
                        </span>
                        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-tertiary)" }}>
                          {dateLabel}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize:    13,
                          lineHeight:  "18px",
                          color:       "var(--text-primary)",
                          display:     "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow:    "hidden",
                        }}
                      >
                        {r.location_name}
                      </p>
                      {r.notes && (
                        <p
                          style={{
                            fontSize:    11,
                            lineHeight:  "16px",
                            color:       "var(--text-secondary)",
                            display:     "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow:    "hidden",
                          }}
                        >
                          {r.notes}
                        </p>
                      )}
                      {domain && (
                        <span
                          className="inline-flex items-center"
                          style={{
                            gap:        4,
                            fontSize:   10,
                            color:      "var(--accent)",
                            marginTop:  2,
                          }}
                        >
                          {domain} <ExternalLink className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </aside>
  );
}
