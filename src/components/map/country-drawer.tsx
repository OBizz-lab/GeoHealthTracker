"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Eye,
  MapPin,
  Radio,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";

import { pillClass, statusLabels } from "@/lib/design-tokens";
import type { Report } from "@/lib/types";

// =============================================================================
// CountryDrawer — single unified drawer that opens whenever the user clicks
// a country (either via the shaded fill, a mention marker, or a spread
// marker). Contains three collapsible sections: Cases, Mentions, Spread.
// Each section can be independently expanded; the entry point determines
// which one starts open.
//
// Drilling into a specific case from the Cases section opens the regular
// CaseDrawer (the shell pops back to this drawer when that one closes).
// =============================================================================

export type CountrySection = "cases" | "mentions" | "spread";

export interface CountryPayload {
  iso:            string;
  cases:          Report[];
  mentions:       Report[];
  exposed:        Report[];   // backed by kind='exposed'; surfaced as "Spread"
  defaultSection: CountrySection;
}

interface CountryDrawerProps {
  country:      CountryPayload | null;
  onClose:      () => void;
  onSelectCase: (report: Report) => void;
}

const ACCENT_SPREAD   = "#7BA0A8"; // teal — matches exposure marker
const ACCENT_MENTIONS = "var(--accent)";

export function CountryDrawer({ country, onClose, onSelectCase }: CountryDrawerProps) {
  const [open, setOpen] = useState<CountrySection | null>(country?.defaultSection ?? "cases");

  if (!country) return null;

  const toggle = (s: CountrySection) =>
    setOpen((prev) => (prev === s ? null : s));

  const totalCases      = country.cases.reduce((sum, r) => sum + r.case_count, 0);
  const totalFatalities = country.cases.reduce((sum, r) => sum + r.fatality_count, 0);

  return (
    <aside
      role="dialog"
      aria-label={`Country detail for ${country.iso}`}
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
        style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center" style={{ gap: 8 }}>
          <MapPin className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
          <span className="t-cap t-up" style={{ color: "var(--text-secondary)" }}>
            Country detail
          </span>
        </div>
        <button onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" style={{ color: "var(--text-tertiary)" }} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto scroll-zinc" style={{ padding: 20 }}>
        <div className="flex flex-col" style={{ gap: 6 }}>
          <h2 className="t-h2" style={{ color: "var(--text-primary)" }}>
            {country.iso}
          </h2>
          <p className="t-cap" style={{ color: "var(--text-secondary)" }}>
            {totalCases.toLocaleString()} case{totalCases === 1 ? "" : "s"}
            {totalFatalities > 0 && ` · ${totalFatalities} fatal`}
            {" · "}
            {country.mentions.length} mention{country.mentions.length === 1 ? "" : "s"}
            {" · "}
            {country.exposed.length} spread record{country.exposed.length === 1 ? "" : "s"}
          </p>
        </div>

        <div
          className="flex flex-col"
          style={{ gap: 1, marginTop: 18 }}
        >
          <Section
            icon={<MapPin className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />}
            label="Cases"
            count={country.cases.length}
            open={open === "cases"}
            onToggle={() => toggle("cases")}
          >
            {country.cases.length === 0 ? (
              <EmptyHint>No confirmed cases for this country yet.</EmptyHint>
            ) : (
              <CasesList reports={country.cases} onSelectCase={onSelectCase} />
            )}
          </Section>

          <Section
            icon={<Radio className="h-3.5 w-3.5" style={{ color: ACCENT_MENTIONS }} />}
            label="Mentions"
            count={country.mentions.length}
            open={open === "mentions"}
            onToggle={() => toggle("mentions")}
          >
            {country.mentions.length === 0 ? (
              <EmptyHint>No news mentions on file for this country.</EmptyHint>
            ) : (
              <MentionsList reports={country.mentions} />
            )}
          </Section>

          <Section
            icon={<Eye className="h-3.5 w-3.5" style={{ color: ACCENT_SPREAD }} />}
            label="Spread"
            count={country.exposed.length}
            open={open === "spread"}
            onToggle={() => toggle("spread")}
          >
            {country.exposed.length === 0 ? (
              <EmptyHint>No surveillance follow-ups recorded.</EmptyHint>
            ) : (
              <SpreadList reports={country.exposed} />
            )}
          </Section>
        </div>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Accordion section
// ---------------------------------------------------------------------------
function Section({
  icon,
  label,
  count,
  open,
  onToggle,
  children,
}: {
  icon:     React.ReactNode;
  label:    string;
  count:    number;
  open:     boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center"
        style={{
          gap:        10,
          padding:    "12px 0",
          background: "transparent",
          color:      "var(--text-primary)",
          cursor:     "pointer",
          textAlign:  "left",
        }}
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--text-tertiary)" }} />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" style={{ color: "var(--text-tertiary)" }} />
        )}
        {icon}
        <span style={{ fontSize: 14, fontWeight: 500 }}>
          {label}
        </span>
        <span
          className="num"
          style={{
            marginLeft: "auto",
            fontSize:   12,
            color:      count === 0 ? "var(--text-tertiary)" : "var(--text-secondary)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {count}
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 0 14px 0" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="t-cap"
      style={{
        color: "var(--text-tertiary)",
        padding: "8px 0",
        fontStyle: "italic",
      }}
    >
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Cases list — drill-in to CaseDrawer
// ---------------------------------------------------------------------------
function CasesList({
  reports,
  onSelectCase,
}: {
  reports:      Report[];
  onSelectCase: (r: Report) => void;
}) {
  const sorted = [...reports].sort(
    (a, b) =>
      new Date(b.reported_date).getTime() - new Date(a.reported_date).getTime(),
  );

  return (
    <ul className="flex flex-col" style={{ gap: 1 }}>
      {sorted.map((r) => {
        const dateLabel = (() => {
          try { return format(parseISO(r.reported_date), "MMM d, yyyy"); }
          catch { return r.reported_date; }
        })();
        const ungeocoded = r.lat == null || r.lng == null;
        return (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => onSelectCase(r)}
              className="flex w-full items-start text-left transition-colors"
              style={{
                gap:           12,
                padding:       "10px 0",
                borderBottom:  "1px solid var(--border-subtle)",
                background:    "transparent",
                cursor:        "pointer",
                color:         "var(--text-primary)",
              }}
            >
              <div className="flex flex-1 flex-col" style={{ minWidth: 0, gap: 4 }}>
                <div className="flex items-center" style={{ gap: 8 }}>
                  <span className={`pill ${pillClass(r.status)}`}>
                    {statusLabels[r.status]}
                  </span>
                  <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-tertiary)" }}>
                    {dateLabel}
                  </span>
                </div>
                <p
                  style={{
                    fontSize:    14,
                    fontWeight:  500,
                    lineHeight:  "20px",
                    color:       "var(--text-primary)",
                    overflow:    "hidden",
                    textOverflow:"ellipsis",
                    whiteSpace:  "nowrap",
                  }}
                >
                  {r.location_name}
                  {r.state_province ? `, ${r.state_province}` : ""}
                </p>
                <div className="flex items-center" style={{ gap: 8, fontSize: 11, color: "var(--text-secondary)", flexWrap: "wrap" }}>
                  <span className="num">
                    {r.case_count.toLocaleString()} case{r.case_count === 1 ? "" : "s"}
                  </span>
                  {r.fatality_count > 0 && (
                    <span className="num" style={{ color: "var(--status-fatal)" }}>
                      · {r.fatality_count} fatal
                    </span>
                  )}
                  {r.condition && <span>· {r.condition}</span>}
                  {ungeocoded && (
                    <span style={{ color: "var(--text-tertiary)", fontStyle: "italic" }}>
                      · no coords
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight
                className="h-4 w-4 shrink-0 self-center"
                style={{ color: "var(--text-tertiary)" }}
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Mentions list — link out to source
// ---------------------------------------------------------------------------
function MentionsList({ reports }: { reports: Report[] }) {
  const sorted = [...reports].sort(
    (a, b) =>
      new Date(b.reported_date).getTime() - new Date(a.reported_date).getTime(),
  );

  return (
    <ul className="flex flex-col" style={{ gap: 1 }}>
      {sorted.map((r) => {
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
                padding:       "10px 0",
                borderBottom:  "1px solid var(--border-subtle)",
                color:         "var(--text-primary)",
              }}
            >
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
                      color:      ACCENT_MENTIONS,
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
  );
}

// ---------------------------------------------------------------------------
// Spread list — surveillance follow-ups
// ---------------------------------------------------------------------------
function SpreadList({ reports }: { reports: Report[] }) {
  const sorted = [...reports].sort(
    (a, b) =>
      new Date(b.reported_date).getTime() - new Date(a.reported_date).getTime(),
  );

  return (
    <>
      <div
        style={{
          background:   "rgba(123,160,168,0.08)",
          border:       `1px solid ${ACCENT_SPREAD}33`,
          borderRadius: 8,
          padding:      "10px 12px",
          fontSize:     11,
          lineHeight:   "16px",
          color:        "var(--text-secondary)",
          marginBottom: 8,
        }}
      >
        Spread = a person who was in close contact with a confirmed case has
        returned to this country. Local authorities are conducting surveillance
        follow-up. <strong style={{ color: "var(--text-primary)" }}>Not a confirmed case.</strong>
      </div>

      <ul className="flex flex-col" style={{ gap: 1 }}>
        {sorted.map((r) => {
          const dateLabel = (() => {
            try { return format(parseISO(r.reported_date), "MMM d, yyyy"); }
            catch { return r.reported_date; }
          })();
          return (
            <li
              key={r.id}
              style={{
                padding:       "10px 0",
                borderBottom:  "1px solid var(--border-subtle)",
              }}
            >
              <div className="flex items-center" style={{ gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                  {r.location_name}
                  {r.state_province ? `, ${r.state_province}` : ""}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-tertiary)" }}>
                  {dateLabel}
                </span>
              </div>
              {r.notes && (
                <p
                  style={{
                    fontSize:   12,
                    lineHeight: "18px",
                    color:      "var(--text-secondary)",
                    marginBottom: 4,
                  }}
                >
                  {r.notes}
                </p>
              )}
              {r.source_url && (
                <a
                  href={r.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display:    "inline-flex",
                    alignItems: "center",
                    gap:        4,
                    fontSize:   11,
                    fontWeight: 500,
                    color:      ACCENT_SPREAD,
                  }}
                >
                  Source: {r.source_name} <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
