"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import { LayersPanel }              from "@/components/map/layers-panel";
import { SignalsPanel }             from "@/components/map/signals-panel";
import { StatsBar, type TimeRange } from "@/components/map/stats-bar";
import { fetchPublishedCases }      from "@/lib/supabase/cases";
import type { Report, ReportStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Dynamic import — keeps mapbox-gl out of the SSR bundle
// ---------------------------------------------------------------------------
const MapView = dynamic(
  () => import("@/components/map/map-view").then((m) => m.MapView),
  { ssr: false, loading: () => <MapLoader label="Loading map…" /> },
);

function MapLoader({ label = "Loading map…" }: { label?: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0f1e]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <span className="text-xs text-zinc-600">{label}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Time-range filter
// ---------------------------------------------------------------------------
const ALL_STATUSES: ReportStatus[] = [
  "confirmed", "fatal", "suspected", "reported", "resolved",
];

function cutoffFor(range: TimeRange): Date | null {
  const now = Date.now();
  if (range === "30d") return new Date(now - 30  * 86_400_000);
  if (range === "6m")  return new Date(now - 180 * 86_400_000);
  if (range === "1y")  return new Date(now - 365 * 86_400_000);
  return null;
}

function applyTimeFilter(reports: Report[], range: TimeRange): Report[] {
  const cutoff = cutoffFor(range);
  if (!cutoff) return reports;
  return reports.filter((r) => {
    try { return new Date(r.reported_date) >= cutoff; }
    catch { return true; }
  });
}

// ---------------------------------------------------------------------------
// MapShell
// ---------------------------------------------------------------------------
interface MapShellProps {
  /** Optional seed data shown while Supabase loads */
  reports?:     Report[];
  mapboxToken:  string | undefined;
}

export function MapShell({ reports: seedReports = [], mapboxToken }: MapShellProps) {
  const [reports,            setReports]           = useState<Report[]>(seedReports);
  const [loading,            setLoading]           = useState(true);
  const [timeRange,          setTimeRange]         = useState<TimeRange>("all");
  const [activeStatuses,     setActiveStatuses]    = useState<Set<ReportStatus>>(new Set(ALL_STATUSES));
  const [showCountryHeatmap, setShowHeatmap]       = useState(true);

  // Fetch live data on mount
  useEffect(() => {
    let cancelled = false;
    fetchPublishedCases()
      .then((live) => { if (!cancelled) setReports(live.length > 0 ? live : seedReports); })
      .catch(()    => { if (!cancelled) setReports(seedReports); })
      .finally(()  => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleToggleStatus(status: ReportStatus) {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        if (next.size === 1) return prev; // keep at least one active
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }

  // Derived: time-filtered, then status-filtered
  const timeFiltered = useMemo(
    () => applyTimeFilter(reports, timeRange),
    [reports, timeRange],
  );
  const filtered = useMemo(
    () => timeFiltered.filter((r) => activeStatuses.has(r.status)),
    [timeFiltered, activeStatuses],
  );

  // Aggregate stats (over status-filtered set)
  const countriesAffected = useMemo(
    () => new Set(filtered.map((r) => r.country).filter((c) => c && c !== "ZZ")).size,
    [filtered],
  );
  const totalCases = useMemo(
    () => filtered.reduce((sum, r) => sum + r.case_count, 0),
    [filtered],
  );

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Background map */}
      {loading && <MapLoader label="Fetching live cases…" />}
      <MapView
        reports={filtered}
        mapboxToken={mapboxToken}
        showCountryHeatmap={showCountryHeatmap}
      />

      {/* ── Stats bar — top-center ── */}
      <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex justify-center sm:inset-x-6 sm:top-5">
        <StatsBar
          totalSignals={filtered.length}
          countriesAffected={countriesAffected}
          totalCases={totalCases}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      </div>

      {/* ── Layers panel — left ── */}
      <div className="pointer-events-none absolute left-4 top-20 z-20 sm:left-6 sm:top-[4.5rem]">
        <LayersPanel
          activeStatuses={activeStatuses}
          onToggle={handleToggleStatus}
          showCountryHeatmap={showCountryHeatmap}
          onToggleHeatmap={() => setShowHeatmap((v) => !v)}
          totalVisible={filtered.length}
          totalAll={reports.length}
        />
      </div>

      {/* ── Signals panel — right ── */}
      <div className="pointer-events-none absolute right-4 top-20 z-20 flex sm:right-6 sm:top-[4.5rem]"
           style={{ height: "calc(100% - 5.5rem)" }}>
        <SignalsPanel reports={timeFiltered} />
      </div>
    </div>
  );
}
