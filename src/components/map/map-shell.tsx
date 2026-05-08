"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, X } from "lucide-react";

import { FiltersPanel, type TimeRange, type Strain, type Region }
  from "@/components/map/filters-panel";
import { LegendCard }       from "@/components/map/legend-card";
import { StatsStrip }       from "@/components/map/stats-strip";
import { LiveSignalStrip }  from "@/components/map/live-signal-strip";
import { CaseDrawer }       from "@/components/map/case-drawer";
import { MentionsDrawer }   from "@/components/map/mentions-drawer";
import { fetchPublishedCases } from "@/lib/supabase/cases";
import type { CountryMentions } from "@/components/map/map-view";
import type { Report, ReportStatus } from "@/lib/types";

// Drawer width (desktop). Used for both stats-strip nudging and layout math.
const DRAWER_WIDTH = 380;

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

  // ── Drawer state — single source of truth, mutually exclusive ─────────────
  // Selecting a confirmed-case marker *replaces* any open mention drawer and
  // vice versa, so the user only ever sees one inspection panel at a time.
  const [selectedReport, setSelectedReport]       = useState<Report | null>(null);
  const [selectedMentions, setSelectedMentions]   = useState<CountryMentions | null>(null);
  const drawerOpen = selectedReport !== null || selectedMentions !== null;

  const handleSelectConfirmed = useCallback((r: Report) => {
    setSelectedMentions(null); // close mention drawer if open
    setSelectedReport(r);
  }, []);
  const handleSelectMentions  = useCallback((c: CountryMentions) => {
    setSelectedReport(null);   // close case drawer if open
    setSelectedMentions(c);
  }, []);
  const closeAllDrawers = useCallback(() => {
    setSelectedReport(null);
    setSelectedMentions(null);
  }, []);

  // Esc closes whichever drawer is open
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeAllDrawers(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, closeAllDrawers]);

  // ── Mobile state — collapsed by default per UX brief ──────────────────────
  // The filter panel becomes a full-screen sheet on mobile; closed by default.
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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

  // ── Stats — confirmed cases drive Cases / Fatalities / Active regions.
  // News mentions are counted separately so they don't inflate fatality totals.
  const confirmed = useMemo(() => filtered.filter((r) => r.kind === "confirmed"), [filtered]);
  const mentions  = useMemo(() => filtered.filter((r) => r.kind === "mention"),   [filtered]);

  const totalCases    = useMemo(() => confirmed.reduce((s, r) => s + r.case_count, 0), [confirmed]);
  const fatalities    = useMemo(
    () =>
      confirmed
        .filter((r) => r.status === "fatal")
        .reduce((s, r) => s + r.case_count, 0),
    [confirmed],
  );
  const activeRegions = useMemo(
    () => new Set(confirmed.map((r) => r.country).filter((c) => c && c !== "ZZ")).size,
    [confirmed],
  );
  const mentionCount  = mentions.length;
  const lastUpdatedLabel = formatRelative(lastFetchedAt);

  const filterChipLabel = (() => {
    const bits: string[] = [];
    if (timeRange !== "all") bits.push(timeRange);
    if (activeStatuses.size < ALL_STATUSES.length) bits.push(`${activeStatuses.size} status`);
    if (activeStrains.size > 0) bits.push(`${activeStrains.size} strain${activeStrains.size === 1 ? "" : "s"}`);
    if (activeRegion) bits.push("region");
    return bits.length > 0 ? bits.join(" · ") : "Filters";
  })();

  return (
    <div className="relative h-full w-full overflow-hidden">
      {loading && <MapLoader label="Fetching cases…" />}
      <div className="absolute inset-0 flex">
        {/* ── Desktop left rail (md+) ─────────────────────────────────────── */}
        <div className="hidden md:block flex-shrink-0">
          <FiltersPanel
            timeRange={timeRange}            onTimeRangeChange={setTimeRange}
            activeStatuses={activeStatuses}  onToggleStatus={handleToggleStatus}
            activeStrains={activeStrains}    onToggleStrain={handleToggleStrain}
            allSources={allSources}          activeSources={activeSources}        onToggleSource={handleToggleSource}
            activeRegion={activeRegion}      onRegionChange={setActiveRegion}
            onClearAll={handleClearAll}
          />
        </div>

        {/* ── Map canvas — flex-1 so it shrinks when the drawer opens.
              MapView's ResizeObserver calls map.resize() on container
              changes, so Mapbox repaints cleanly with no black bars. */}
        <div className="relative flex-1 min-w-0">
          <MapView
            reports={filtered}
            mapboxToken={mapboxToken}
            showCountryHeatmap={showHeatmap}
            onSelectConfirmed={handleSelectConfirmed}
            onSelectMentions={handleSelectMentions}
          />

          {/* ── Stats strip — top center of the map area. Because the
                drawer is now a flex sibling (below), the map area's width
                already excludes it; the strip auto-recentres and the
                ResizeObserver inside StatsStrip picks the right layout. */}
          <div
            className="pointer-events-none absolute z-20 flex justify-center"
            style={{ top: 8, left: 8, right: 8 }}
          >
            <div
              className="pointer-events-auto"
              style={{ width: "100%", maxWidth: 720 }}
            >
              <StatsStrip
                totalCases={totalCases}
                fatalities={fatalities}
                activeRegions={activeRegions}
                mentions={mentionCount}
                lastUpdatedLabel={lastUpdatedLabel}
              />
            </div>
          </div>

          {/* ── Mobile filter button (top-left, only when sheet closed) ──── */}
          {!mobileFiltersOpen && (
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="pointer-events-auto absolute z-20 flex items-center md:hidden"
              style={{
                top: 76, left: 12,
                gap: 6,
                padding: "8px 12px",
                borderRadius: 9999,
                background: "var(--map-overlay-bg)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                fontSize: 12,
                fontWeight: 600,
                boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              }}
            >
              <Filter className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
              {filterChipLabel}
            </button>
          )}

          {/* ── Legend — bottom-left, hidden on mobile ────────────────────── */}
          <div
            className="pointer-events-auto absolute hidden md:block"
            style={{ bottom: 56, left: 16 }}
          >
            <LegendCard
              activeStatuses={activeStatuses}
              onToggle={handleToggleStatus}
            />
          </div>

          {/* ── Live signal strip — bottom edge of the map area only. The
                drawer is a flex sibling so the strip naturally stops at the
                drawer's left edge. */}
          <div
            className="pointer-events-auto absolute z-20"
            style={{ left: 0, right: 0, bottom: 0 }}
          >
            <LiveSignalStrip />
          </div>

          {/* ── Mobile drawers — bottom sheet at 65vh, sits above the
                live-signal strip. Desktop renders the drawer as a flex
                sibling further down (outside this map-area div). */}
          {selectedReport && (
            <div
              className="pointer-events-auto absolute z-30 md:hidden"
              style={{ left: 0, right: 0, bottom: 40, height: "65vh", maxHeight: "65vh" }}
            >
              <CaseDrawer report={selectedReport} onClose={closeAllDrawers} />
            </div>
          )}
          {selectedMentions && (
            <div
              className="pointer-events-auto absolute z-30 md:hidden"
              style={{ left: 0, right: 0, bottom: 40, height: "65vh", maxHeight: "65vh" }}
            >
              <MentionsDrawer country={selectedMentions} onClose={closeAllDrawers} />
            </div>
          )}
        </div>

        {/* ── Desktop right drawer — flex sibling, pushes the map ───────────
              Animated width change so the map shrinks smoothly. MapView's
              ResizeObserver fires map.resize() on each frame. */}
        <div
          className="hidden md:block flex-shrink-0 overflow-hidden"
          style={{
            width:      drawerOpen ? DRAWER_WIDTH : 0,
            transition: "width 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
        >
          {selectedReport && (
            <CaseDrawer report={selectedReport} onClose={closeAllDrawers} />
          )}
          {selectedMentions && (
            <MentionsDrawer country={selectedMentions} onClose={closeAllDrawers} />
          )}
        </div>
      </div>

      {/* ── Mobile filters bottom sheet ──────────────────────────────────── */}
      {mobileFiltersOpen && (
        <div className="absolute inset-0 z-40 flex flex-col md:hidden">
          {/* backdrop */}
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setMobileFiltersOpen(false)}
            className="flex-1"
            style={{ background: "rgba(0,0,0,0.5)" }}
          />
          {/* sheet — bottom 80vh */}
          <div
            className="flex flex-col"
            style={{
              height:        "80vh",
              background:    "var(--bg-surface)",
              borderTopLeftRadius:  16,
              borderTopRightRadius: 16,
              borderTop:     "1px solid var(--border-default)",
              boxShadow:     "0 -8px 32px rgba(0,0,0,0.5)",
            }}
          >
            <div className="flex items-center justify-between" style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
              <span className="t-label" style={{ color: "var(--text-primary)" }}>Filters</span>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
              >
                <X className="h-4 w-4" style={{ color: "var(--text-tertiary)" }} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <FiltersPanel
                timeRange={timeRange}            onTimeRangeChange={setTimeRange}
                activeStatuses={activeStatuses}  onToggleStatus={handleToggleStatus}
                activeStrains={activeStrains}    onToggleStrain={handleToggleStrain}
                allSources={allSources}          activeSources={activeSources}        onToggleSource={handleToggleSource}
                activeRegion={activeRegion}      onRegionChange={setActiveRegion}
                onClearAll={handleClearAll}
                fullWidth
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

