"use client";

import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  Copy,
  ExternalLink,
  Share2,
  X,
} from "lucide-react";
import { useState } from "react";

import { pillClass, statusLabels } from "@/lib/design-tokens";
import type { Report } from "@/lib/types";

interface CaseDrawerProps {
  report: Report | null;
  onClose: () => void;
}

// =============================================================================
// CaseDrawer — DESIGN_DOC §5.8
// 380px right-side drawer. Slide-in on marker click. Esc / X / map click closes.
// =============================================================================

export function CaseDrawer({ report, onClose }: CaseDrawerProps) {
  const [copied, setCopied] = useState(false);

  if (!report) return null;

  const reportedDate = (() => {
    try { return format(parseISO(report.reported_date), "MMM d, yyyy"); }
    catch { return report.reported_date; }
  })();

  function handleCopyCoords() {
    if (!report) return;
    void navigator.clipboard.writeText(`${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleShare() {
    if (!report) return;
    const url = `${window.location.origin}/cases/${report.id}`;
    void navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <aside
      role="dialog"
      aria-label={`Case detail for ${report.location_name}`}
      className="pointer-events-auto absolute right-0 top-0 z-30 flex h-full flex-col"
      style={{
        width:        380,
        background:   "var(--bg-surface)",
        borderLeft:   "1px solid var(--border-subtle)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-subtle)" }}
      >
        <span className="t-cap t-up" style={{ color: "var(--text-secondary)" }}>
          Case detail
        </span>
        <button onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" style={{ color: "var(--text-tertiary)" }} />
        </button>
      </div>

      {/* Body */}
      <div
        className="flex-1 overflow-y-auto scroll-zinc"
        style={{ padding: 20 }}
      >
        <div className="flex flex-col" style={{ gap: 16 }}>
          {/* Status pill */}
          <span className={`pill ${pillClass(report.status)}`} style={{ alignSelf: "flex-start" }}>
            {statusLabels[report.status]}
          </span>

          {/* Location + coords */}
          <div className="flex flex-col" style={{ gap: 4 }}>
            <h2 className="t-h2">{report.location_name}</h2>
            {(report.state_province || (report.country && report.country !== "ZZ")) && (
              <p className="t-cap" style={{ color: "var(--text-secondary)" }}>
                {report.state_province
                  ? `${report.state_province}${report.country && report.country !== "ZZ" ? `, ${report.country}` : ""}`
                  : report.country}
              </p>
            )}
            <button
              onClick={handleCopyCoords}
              className="t-mono inline-flex items-center"
              style={{ gap: 6, color: "var(--text-secondary)", alignSelf: "flex-start" }}
            >
              {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
              <Copy className="h-3 w-3" />
            </button>
          </div>

          {/* Multiple cases banner */}
          {report.case_count > 1 && (
            <div
              style={{
                background:   "var(--accent-muted)",
                border:       "1px solid var(--accent)",
                borderRadius: 8,
                padding:      12,
              }}
            >
              <div
                className="t-h3"
                style={{ color: "var(--accent)" }}
              >
                {report.case_count} cases at this location
              </div>
              <div
                className="t-cap"
                style={{ color: "var(--text-secondary)" }}
              >
                Aggregated cluster — see notes for breakdown.
              </div>
            </div>
          )}

          {/* Field rows */}
          <div className="flex flex-col" style={{ gap: 12 }}>
            <FieldRow label="Reported" value={reportedDate} />
            {report.condition && (
              <FieldRow
                label="Strain"
                valueNode={
                  <span className="pill pill-neutral">{report.condition}</span>
                }
              />
            )}
            <FieldRow
              label="Severity"
              value={report.severity[0].toUpperCase() + report.severity.slice(1)}
            />
            <FieldRow
              label="Cases"
              value={report.case_count.toLocaleString()}
            />
          </div>

          {/* Notes */}
          {report.notes && (
            <div className="flex flex-col" style={{ gap: 6 }}>
              <div className="t-cap t-up" style={{ color: "var(--text-secondary)" }}>
                Notes
              </div>
              <p
                style={{
                  fontSize:   13,
                  lineHeight: "20px",
                  color:      "var(--text-secondary)",
                }}
              >
                {report.notes}
              </p>
            </div>
          )}

          {/* Source */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <div className="t-cap t-up" style={{ color: "var(--text-secondary)" }}>
              Source
            </div>
            <a
              href={report.source_url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
              style={{
                gap:           8,
                background:    "var(--bg-base)",
                border:        "1px solid var(--border-default)",
                borderRadius:  8,
                padding:       10,
                color:         "var(--text-primary)",
              }}
            >
              <span
                className="flex items-center justify-center"
                style={{
                  width:    16, height: 16,
                  borderRadius: 3,
                  background:  "var(--accent-muted)",
                  fontSize:    9,
                  fontWeight:  700,
                  color:       "var(--accent)",
                }}
              >
                {(report.source_name ?? "?").slice(0, 2).toUpperCase()}
              </span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {report.source_name}
              </span>
              <span style={{ marginLeft: "auto" }}>
                <ExternalLink className="h-3.5 w-3.5" style={{ color: "var(--text-tertiary)" }} />
              </span>
            </a>
          </div>

          {/* Provenance footer */}
          <div
            className="t-cap"
            style={{
              borderTop:  "1px solid var(--border-subtle)",
              paddingTop: 12,
              color:      "var(--text-secondary)",
            }}
          >
            Reported {reportedDate} · Verified by moderator
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex items-center"
        style={{
          padding:    14,
          gap:        8,
          borderTop:  "1px solid var(--border-subtle)",
        }}
      >
        <button
          onClick={handleShare}
          className="inline-flex flex-1 items-center justify-center transition-colors"
          style={{
            padding:      "8px 12px",
            borderRadius: 8,
            background:   "var(--bg-elevated)",
            border:       "1px solid var(--border-default)",
            color:        "var(--text-primary)",
            fontSize:     12,
            fontWeight:   500,
            gap:          6,
          }}
        >
          <Share2 className="h-3 w-3" />
          Share link
        </button>
        <a
          href={`mailto:omar@hantavirustrack.org?subject=Case+report+issue:+${encodeURIComponent(report.id)}`}
          className="inline-flex flex-1 items-center justify-center transition-colors"
          style={{
            padding:      "8px 12px",
            borderRadius: 8,
            color:        "var(--text-secondary)",
            fontSize:     12,
            fontWeight:   500,
            gap:          6,
          }}
        >
          <AlertTriangle className="h-3 w-3" />
          Report issue
        </a>
      </div>

      {/* Toast */}
      {copied && (
        <div
          className="absolute"
          style={{
            bottom:        70,
            left:          "50%",
            transform:     "translateX(-50%)",
            background:    "var(--bg-elevated)",
            border:        "1px solid var(--status-recovered)",
            borderRadius:  8,
            padding:       "8px 14px",
            fontSize:      12,
            fontWeight:    500,
            boxShadow:     "var(--shadow-2)",
            color:         "var(--status-recovered)",
          }}
        >
          Link copied
        </div>
      )}
    </aside>
  );
}

// ---------------------------------------------------------------------------
// FieldRow
// ---------------------------------------------------------------------------
function FieldRow({
  label,
  value,
  valueNode,
}: {
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        paddingBottom: 8,
      }}
    >
      <span
        className="t-cap"
        style={{ width: 120, color: "var(--text-secondary)" }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
        {valueNode ?? value}
      </span>
    </div>
  );
}
