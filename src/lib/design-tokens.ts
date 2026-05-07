import type { ReportStatus, ReportSeverity } from "./types";

export const colors = {
  bg: "#0a0f1e",
  surface: "#111827",
  surfaceElevated: "#1f2937",
  border: "#27314a",
  borderMuted: "#1c2436",

  text: {
    primary: "#f4f4f5",
    secondary: "#a1a1aa",
    muted: "#71717a",
    subtle: "#52525b",
  },

  status: {
    confirmed: "#ef4444",
    suspected: "#f59e0b",
    reported: "#3b82f6",
    resolved: "#22c55e",
  } as Record<ReportStatus, string>,

  severity: {
    low: "#22c55e",
    moderate: "#3b82f6",
    high: "#f59e0b",
    critical: "#ef4444",
  } as Record<ReportSeverity, string>,

  accent: {
    primary: "#3b82f6",
    primaryHover: "#2563eb",
  },
} as const;

export const statusLabels: Record<ReportStatus, string> = {
  confirmed: "Confirmed",
  suspected: "Suspected",
  reported: "Reported",
  resolved: "Resolved",
};

export const severityLabels: Record<ReportSeverity, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  critical: "Critical",
};
