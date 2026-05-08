"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import { FiltersPanel, type TimeRange, type Strain, type Region }
  from "@/components/map/filters-panel";
import { LegendCard }   from "@/components/map/legend-card";
import { StatsStrip }   from "@/components/map/stats-strip";
import { fetchPublishedCases } from "@/lib/supabase/cases";
import type { Report, ReportStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Dynamic map view (mapbox-gl out of SSR bundle)
// ---------------------------------------------------------------------------
const MapView = dynamic(
  () => import("@/components/map/map-view").then((m) => m.MapView),
  { ssr: false, loading: () => <MapLoader label="Loading map…" /> },
);

function MapLoader({ label = "Loading map…" }: { label?: string }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ background: "var(--bg-base)", gap: 12 }}
    >
      <div
        className="animate-spin rounded-full"
        style={{
          width: 32, height: 32,
          border: "2px solid var(--border-default)",
          borderTopColor: "var(--accent)",
        }}
      />
      <span className="t-label" style={{ color: "var(--text-secondary)" }}>{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Region preset → bbox-style filter (we apply lat/lng filters not bbox here)
// ---------------------------------------------------------------------------
const REGION_FILTERS: Record<Region, (r: Report) => boolean> = {
  four_corners: (r) =>
    ["NM", "AZ", "CO", "UT"].includes(r.state_province ?? "") ||
    (r.country === "US" && r.lat >= 32 && r.lat <= 42 && r.lng >= -114 && r.lng <= -102),
  continental_us: (r) => r.country === "US",
  latin_america: (r) =>
    ["MX","GT","HN","SV","NI","CR","PA","CO","VE","EC","PE","BR","BO","PY","UY","AR","CL"].includes(r.country),
  europe: (r) =>
    ["GB","IE","FR","DE","ES","PT","IT","NL","BE","AT","CH","SE","NO","FI","DK","PL","CZ","HU","RO","BG","GR","HR","SI","SK","EE","LV","LT","UA","RU"].includes(r.country),
  world: () => true,
};

const ALL_STATUSES: ReportStatus[] = ["confirmed", "suspected", "fatal", "reported", "resolved"];

function cutoffFor(range: TimeRange): Date | null {
  const now = Date.now();
  if (range === "7d")  return new Date(now -   7 * 86_400_000);
  if (range === "30d") return new Date(now -  30 * 86_400_000);
  if (range === "90d") return new Date(now -  90 * 86_400_000);
  if (range === "1y")  return new Date(now - 365 * 86_400_000);
  return null;
}

function formatRelative(date: Date | null): string {
  if (!date) return "—";
  const diffMin = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (diffMin < 1)    return "just now";
  if (diffMin < 60)   return `${diffMin}m ago`;
  const hr = Math.floor(diffMin / 60);
  if (hr < 24)        return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

// ---------------------------------------------------------------------------
// MapShell
// ---------------------------------------------------------------------------
interface MapShellProps {
  reports?:    Report[];
  mapboxToken: string | undefined;
}

export function MapShell({ reports: seedReports = [], mapboxToken }: MapShellProps) {
  const [reports,        setReports]        = useState<Report[]>(seedReports);
  const [loading,        setLoading]        = useState(true);
  const [lastFetchedAt,  setLastFetchedAt]  = useState<Date | null>(null);

  const [timeRange,      setTimeRange]      = useState<TimeRange>("all");
  const [activeStatuses, setActiveStatuses] = useState<Set<ReportStatus>>(new Set(ALL_STATUSES));
  const [activeStrains,  setActiveStrains]  = useState<Set<Strain>>(new Set());
  const [activeSources,  setActiveSources]  = useState<Set<string>>(new Set());
  const [activeRegion,   setActiveRegion]   = useState<Region | null>(null);
  const [showHeatmap]                       = useState(true); // always on per design

  // Initial fetch
  useEffect(() => {
    let cancelled = false;
    fetchPublishedCases()
      .then((live) => {
        if (cancelled) return;
        setReports(live.length > 0 ? live : seedReports);
        setLastFetchedAt(new Date());
      })
      .catch(() => { if (!cancelled) setReports(seedReports); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived: source list (union of all report sources) ────────────────────
  const allSources = useMemo(
    () => Array.from(new Set(reports.map((r) => r.source_name).filter(Boolean))).sort(),
    [reports],
  );

  // Initialize activeSources to "all sources active" once sources are known
  useEffect(() => {
    if (activeSources.size === 0 && allSources.length > 0) {
      setActiveSources(new Set(allSources));
    }
  }, [allSources, activeSources.size]);

  // ── Filters ──────────────────────────────────────────────────────────────
  function handleToggleStatus(s: ReportStatus) {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) {
        if (next.size === 1) return prev; // keep at least one
        next.delete(s);
      } else next.add(s);
      return next;
    });
  }
  function handleToggleStrain(s: Strain) {
    setActiveStrains((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  }
  function handleToggleSource(slug: string) {
    setActiveSources((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }
  function handleClearAll() {
    setTimeRange("all");
    setActiveStatuses(new Set(ALL_STATUSES));
    setActiveStrains(new Set());
    setActiveSources(new Set(allSources));
    setActiveRegion(null);
  }

  // ── Filtered reports ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const cutoff = cutoffFor(timeRange);
    return reports.filter((r) => {
      // Time
      if (cutoff) {
        try { if (new Date(r.reported_date) < cutoff) return false; }
        catch { /* keep on parse error */ }
      }
      // Status
      if (!activeStatuses.has(r.status)) return false;
      // Strain — only filter when user has explicitly selected ≥1 strain
      if (activeStrains.size > 0) {
        const cs = (r.condition ?? "").toLowerCase();
        const matches = Array.from(activeStrains).some((s) => {
          if (s === "sin_nombre") return cs.includes("sin nombre");
          if (s === "andes")      return cs.includes("andes");
          if (s === "seoul")      return cs.includes("seoul");
          if (s === "puumala")    return cs.includes("puumala");
          if (s === "other")      return cs && !["sin nombre","andes","seoul","puumala"].some((k) => cs.includes(k));
          return false;
        });
        if (!matches) return false;
      }
      // Source
      if (activeSources.size > 0 && allSources.length > 0 && !activeSources.has(r.source_name)) return false;
      // Region
      if (activeRegion && !REGION_FILTERS[activeRegion](r)) return false;
      return true;
    });
  }, [reports, timeRange, activeStatuses, activeStrains, activeSources, activeRegion, allSources]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalCases    = useMemo(() => filtered.reduce((s, r) => s + r.case_count, 0), [filtered]);
  const fatalities    = useMemo(
    () =>
      filtered
        .filter((r) => r.status === "fatal")
        .reduce((s, r) => s + r.case_count, 0),
    [filtered],
  );
  const activeRegions = useMemo(
    () => new Set(filtered.map((r) => r.country).filter((c) => c && c !== "ZZ")).size,
    [filtered],
  );
  const lastUpdatedLabel = formatRelative(lastFetchedAt);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Background map */}
      {loading && <MapLoader label="Fetching cases…" />}
      <div className="absolute inset-0 flex">
        {/* Left rail — Filters Panel */}
        <FiltersPanel
          timeRange={timeRange}            onTimeRangeChange={setTimeRange}
          activeStatuses={activeStatuses}  onToggleStatus={handleToggleStatus}
          activeStrains={activeStrains}    onToggleStrain={handleToggleStrain}
          allSources={allSources}          activeSources={activeSources}        onToggleSource={handleToggleSource}
          activeRegion={activeRegion}      onRegionChange={setActiveRegion}
          onClearAll={handleClearAll}
        />

        {/* Map canvas */}
        <div className="relative flex-1">
          <MapView
            reports={filtered}
            mapboxToken={mapboxToken}
            showCountryHeatmap={showHeatmap}
          />

          {/* Stats strip — top center */}
          <div
            className="pointer-events-auto absolute"
            style={{ top: 16, left: "50%", transform: "translateX(-50%)" }}
          >
            <StatsStrip
              totalCases={totalCases}
              fatalities={fatalities}
              activeRegions={activeRegions}
              lastUpdatedLabel={lastUpdatedLabel}
            />
          </div>

          {/* Legend — bottom-left */}
          <div className="pointer-events-auto absolute" style={{ bottom: 16, left: 16 }}>
            <LegendCard
              activeStatuses={activeStatuses}
              onToggle={handleToggleStatus}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
