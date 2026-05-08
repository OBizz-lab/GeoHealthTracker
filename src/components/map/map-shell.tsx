"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { LegendPanel } from "@/components/map/legend-panel";
import type { Report, ReportStatus } from "@/lib/types";

const MapView = dynamic(
  () => import("@/components/map/map-view").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-[#0a0f1e]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-xs text-zinc-500">Loading map…</span>
        </div>
      </div>
    ),
  },
);

const ALL_STATUSES: ReportStatus[] = [
  "confirmed",
  "suspected",
  "reported",
  "resolved",
];

interface MapShellProps {
  reports: Report[];
  mapboxToken: string | undefined;
}

export function MapShell({ reports, mapboxToken }: MapShellProps) {
  const [activeStatuses, setActiveStatuses] = useState<Set<ReportStatus>>(
    new Set(ALL_STATUSES),
  );

  function handleToggle(status: ReportStatus) {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        // Don't allow deselecting all
        if (next.size === 1) return prev;
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }

  const filteredReports = reports.filter((r) => activeStatuses.has(r.status));

  return (
    <div className="relative h-full w-full">
      <MapView reports={filteredReports} mapboxToken={mapboxToken} />
      <div className="pointer-events-none absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
        <LegendPanel
          activeStatuses={activeStatuses}
          onToggle={handleToggle}
          totalVisible={filteredReports.length}
          totalAll={reports.length}
        />
      </div>
    </div>
  );
}
