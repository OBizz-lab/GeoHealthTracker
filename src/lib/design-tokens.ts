import type { ReportStatus, ReportSeverity } from "./types";

// =============================================================================
// HantaVirusTrack canonical design tokens — mirror of globals.css :root vars
// (DESIGN_DOC §2)
// =============================================================================

export const colors = {
  // Surface
  bg:          "#0A0E1A",
  surface:     "#111726",
  elevated:    "#1A2236",
  overlay:     "#1F2A44",

  // Borders
  border:       "#2A3550",
  borderSubtle: "#1F2A44",
  borderStrong: "#3D4A6B",

  // Text
  text: {
    primary:   "#E8EDF7",
    secondary: "#A3AECF",
    tertiary:  "#6E7A9C",
    inverse:   "#0A0E1A",
    // Legacy aliases used by older callsites
    muted:     "#A3AECF",
    subtle:    "#6E7A9C",
  },

  // Brand / accent
  accent: {
    primary:      "#5BC0EB",
    primaryHover: "#7AD4FA",
    muted:        "#1E3A4A",
  },

  // Status (markers + pills)
  status: {
    confirmed: "#FF6B6B",
    suspected: "#FFB84D",
    fatal:     "#C92A4F",
    reported:  "#5BC0EB",
    resolved:  "#51CF66",
  } as Record<ReportStatus, string>,

  // Severity
  severity: {
    low:      "#51CF66",
    moderate: "#5BC0EB",
    high:     "#FFB84D",
    critical: "#C92A4F",
  } as Record<ReportSeverity, string>,

  // Map clusters (count-thresholded)
  cluster: {
    low:  "#FFB84D", // < 10
    med:  "#FF6B6B", // 10–49
    high: "#C92A4F", // 50+
  },

  // Map overlay panels
  map: {
    overlayBg: "rgba(17, 23, 38, 0.92)",
  },
} as const;

export const statusLabels: Record<ReportStatus, string> = {
  confirmed: "Confirmed",
  suspected: "Suspected",
  fatal:     "Fatal",
  reported:  "Reported",
  resolved:  "Resolved",
};

export const severityLabels: Record<ReportSeverity, string> = {
  low:      "Low",
  moderate: "Moderate",
  high:     "High",
  critical: "Critical",
};

// Pill class helper — maps status → CSS pill class
export function pillClass(status: ReportStatus): string {
  switch (status) {
    case "confirmed": return "pill-confirmed";
    case "suspected": return "pill-suspected";
    case "fatal":     return "pill-fatal";
    case "resolved":  return "pill-recovered";
    case "reported":
    default:          return "pill-info";
  }
}
