"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

import { centroidFor } from "@/lib/country-centroids";
import type { Report, ReportStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Constants — DESIGN_DOC §5.2 / §5.4
// ---------------------------------------------------------------------------
const MAP_STYLE = "mapbox://styles/mapbox/dark-v11";
// World-centered default. Slightly north of the equator so the visual mass of
// landmass sits comfortably in frame. We never request the user's location.
const INIT_CENTER: [number, number] = [0, 20];
const INIT_ZOOM = 1.5;

const STATUS_COLOR: Record<ReportStatus, string> = {
  fatal:     "#C92A4F",
  confirmed: "#FF6B6B",
  suspected: "#FFB84D",
  reported:  "#5BC0EB",
  resolved:  "#51CF66",
};

const FILL_COLOR: Record<ReportStatus, string> = {
  fatal:     "#C92A4F",
  confirmed: "#FF6B6B",
  suspected: "#FFB84D",
  reported:  "#5BC0EB",
  resolved:  "#51CF66",
};

const STATUS_LABEL: Record<ReportStatus, string> = {
  fatal:     "Fatal",
  confirmed: "Confirmed",
  suspected: "Suspected",
  reported:  "Reported",
  resolved:  "Resolved",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toCasesGeoJSON(reports: Report[]) {
  // Only confirmed cases go into the case-marker source. Mentions are
  // aggregated separately into a per-country centroid layer.
  return {
    type: "FeatureCollection" as const,
    features: reports
      .filter((r) => r.kind === "confirmed")
      .map((r) => ({
        type: "Feature" as const,
        properties: {
          id:         r.id,
          status:     r.status,
          color:      STATUS_COLOR[r.status] ?? "#5BC0EB",
          case_count: r.case_count,
        },
        geometry: { type: "Point" as const, coordinates: [r.lng, r.lat] as [number, number] },
      })),
  };
}

// =============================================================================
// Mention aggregation — group news/mention rows by country, snap each group
// to the country's centroid, and render one marker per country regardless of
// how many articles came in.
// =============================================================================
export interface CountryMentions {
  iso:       string;
  centroid:  [number, number];
  count:     number;
  reports:   Report[];
}

export function aggregateMentionsByCountry(reports: Report[]): Map<string, CountryMentions> {
  const out = new Map<string, CountryMentions>();
  for (const r of reports) {
    if (r.kind !== "mention") continue;
    if (!r.country || r.country === "ZZ") continue;
    const centroid = centroidFor(r.country);
    if (!centroid) continue;
    const cur = out.get(r.country);
    if (!cur) {
      out.set(r.country, { iso: r.country, centroid, count: 1, reports: [r] });
    } else {
      cur.count += 1;
      cur.reports.push(r);
    }
  }
  return out;
}

function toMentionsGeoJSON(mentions: Map<string, CountryMentions>) {
  return {
    type: "FeatureCollection" as const,
    features: Array.from(mentions.values()).map((m) => ({
      type: "Feature" as const,
      properties: {
        iso:   m.iso,
        count: m.count,
      },
      geometry: { type: "Point" as const, coordinates: m.centroid },
    })),
  };
}

// =============================================================================
// Exposure aggregation — group `kind='exposed'` rows by country (surveillance
// follow-up countries: a contact of a confirmed case has returned home).
// One marker per country at its centroid, distinct from confirmed/mention
// visuals. Click → ExposureDrawer.
// =============================================================================
export interface CountryExposure {
  iso:       string;
  centroid:  [number, number];
  count:     number;
  reports:   Report[];
}

export function aggregateExposureByCountry(reports: Report[]): Map<string, CountryExposure> {
  const out = new Map<string, CountryExposure>();
  for (const r of reports) {
    if (r.kind !== "exposed") continue;
    if (!r.country || r.country === "ZZ") continue;
    const centroid = centroidFor(r.country);
    if (!centroid) continue;
    const cur = out.get(r.country);
    if (!cur) {
      out.set(r.country, { iso: r.country, centroid, count: 1, reports: [r] });
    } else {
      cur.count += 1;
      cur.reports.push(r);
    }
  }
  return out;
}

function toExposureGeoJSON(exposures: Map<string, CountryExposure>) {
  return {
    type: "FeatureCollection" as const,
    features: Array.from(exposures.values()).map((e) => ({
      type: "Feature" as const,
      properties: { iso: e.iso, count: e.count },
      geometry: { type: "Point" as const, coordinates: e.centroid },
    })),
  };
}

// =============================================================================
// Per-country aggregation
// Sums case_count per ISO-2 country code; returns highest-rank status (worst
// outcome present) and total reports.
// =============================================================================
const STATUS_RANK: Record<string, number> = {
  resolved: 0, reported: 1, suspected: 2, confirmed: 3, fatal: 4,
};

export interface CountryStats {
  iso:          string;
  totalCases:   number;
  reportCount:  number;
  topStatus:    ReportStatus;
}

export function aggregateByCountry(reports: Report[]): Map<string, CountryStats> {
  // CONFIRMED cases only — news mentions never paint the country fill.
  const out = new Map<string, CountryStats>();
  for (const r of reports) {
    if (r.kind !== "confirmed") continue;
    if (!r.country || r.country === "ZZ") continue;
    const prev = out.get(r.country);
    if (!prev) {
      out.set(r.country, {
        iso:         r.country,
        totalCases:  r.case_count,
        reportCount: 1,
        topStatus:   r.status,
      });
    } else {
      prev.totalCases  += r.case_count;
      prev.reportCount += 1;
      if (STATUS_RANK[r.status] > STATUS_RANK[prev.topStatus]) prev.topStatus = r.status;
    }
  }
  return out;
}

// ── Cluster-scale color from total case count (matches legend / clusters) ──
const CLUSTER_LOW  = "#FFB84D"; //  < 10
const CLUSTER_MED  = "#FF6B6B"; // 10–49
const CLUSTER_HIGH = "#C92A4F"; // 50+

function colorForCount(n: number): string {
  if (n >= 50) return CLUSTER_HIGH;
  if (n >= 10) return CLUSTER_MED;
  return CLUSTER_LOW;
}

// Opacity steps — calibrated so each band is unmistakably visible against
// the dark map background while preserving rank order.
function opacityForCount(n: number): number {
  if (n >= 50) return 0.55;
  if (n >= 10) return 0.45;
  if (n >=  3) return 0.35;
  return 0.28;
}

function buildCountryExpressions(stats: Map<string, CountryStats>) {
  if (stats.size === 0) return null;

  const fillColor:   unknown[] = ["match", ["get", "iso_3166_1"]];
  const fillOpacity: unknown[] = ["match", ["get", "iso_3166_1"]];
  const lineColor:   unknown[] = ["match", ["get", "iso_3166_1"]];
  const lineOpacity: unknown[] = ["match", ["get", "iso_3166_1"]];

  stats.forEach((s, iso) => {
    const fill = colorForCount(s.totalCases);
    const ring = FILL_COLOR[s.topStatus]; // outline encodes worst-status
    fillColor.push(iso, fill);
    fillOpacity.push(iso, opacityForCount(s.totalCases));
    lineColor.push(iso, ring);
    lineOpacity.push(iso, 0.85);
  });
  fillColor.push("#000000");   fillOpacity.push(0);
  lineColor.push("#000000");   lineOpacity.push(0);
  return { fillColor, fillOpacity, lineColor, lineOpacity };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface MapViewProps {
  reports:            Report[];
  mapboxToken:        string | undefined;
  showCountryHeatmap: boolean;
  /** Called when the user clicks a confirmed-case marker. Shell owns drawer state. */
  onSelectConfirmed?: (report: Report) => void;
  /** Called when the user clicks a per-country news-mention marker. */
  onSelectMentions?:  (country: CountryMentions) => void;
  /** Called when the user clicks a per-country exposure-follow-up marker. */
  onSelectExposure?:  (country: CountryExposure) => void;
}

export function MapView({
  reports,
  mapboxToken,
  showCountryHeatmap,
  onSelectConfirmed,
  onSelectMentions,
  onSelectExposure,
}: MapViewProps) {
  const containerRef        = useRef<HTMLDivElement | null>(null);
  const mapRef              = useRef<mapboxgl.Map | null>(null);
  const reportByIdRef       = useRef<Map<string, Report>>(new Map());
  const countryStatsRef     = useRef<Map<string, CountryStats>>(new Map());
  const countryMentionsRef  = useRef<Map<string, CountryMentions>>(new Map());
  const countryExposureRef  = useRef<Map<string, CountryExposure>>(new Map());
  const hoverPopupRef       = useRef<mapboxgl.Popup | null>(null);
  // Refs for callbacks so the once-installed click handlers always see the
  // current shell-owned setters (avoids stale-closure bugs on re-render).
  const onSelectConfirmedRef = useRef(onSelectConfirmed);
  const onSelectMentionsRef  = useRef(onSelectMentions);
  const onSelectExposureRef  = useRef(onSelectExposure);
  useEffect(() => { onSelectConfirmedRef.current = onSelectConfirmed; }, [onSelectConfirmed]);
  useEffect(() => { onSelectMentionsRef.current  = onSelectMentions;  }, [onSelectMentions]);
  useEffect(() => { onSelectExposureRef.current  = onSelectExposure;  }, [onSelectExposure]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const m = new Map<string, Report>();
    reports.forEach((r) => m.set(r.id, r));
    reportByIdRef.current = m;
  }, [reports]);

  const casesGeoJSON       = useMemo(() => toCasesGeoJSON(reports), [reports]);
  const countryStats       = useMemo(() => aggregateByCountry(reports), [reports]);
  const countryMentions    = useMemo(() => aggregateMentionsByCountry(reports), [reports]);
  const countryExposure    = useMemo(() => aggregateExposureByCountry(reports), [reports]);
  const mentionsGeoJSON    = useMemo(() => toMentionsGeoJSON(countryMentions), [countryMentions]);
  const exposureGeoJSON    = useMemo(() => toExposureGeoJSON(countryExposure),  [countryExposure]);
  const countryExpressions = useMemo(() => buildCountryExpressions(countryStats), [countryStats]);

  // Keep refs fresh for closure-based event handlers
  useEffect(() => { countryStatsRef.current    = countryStats;    }, [countryStats]);
  useEffect(() => { countryMentionsRef.current = countryMentions; }, [countryMentions]);
  useEffect(() => { countryExposureRef.current = countryExposure; }, [countryExposure]);

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapboxToken || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container:        containerRef.current,
      style:            MAP_STYLE,
      center:           INIT_CENTER,
      zoom:             INIT_ZOOM,
      projection:       "mercator",
      attributionControl: false,
    });

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new mapboxgl.ScaleControl({ unit: "imperial" }), "bottom-left");

    map.on("load", () => {
      const firstSymbol = map.getStyle().layers.find((l) => l.type === "symbol")?.id;

      // Country choropleth ─────────────────────────────────────────────────
      map.addSource("country-boundaries", {
        type: "vector",
        url:  "mapbox://mapbox.country-boundaries-v1",
      });
      // Worldview filter — "all" (undisputed) plus "US" (disputed-region
      // version matching a Western worldview). Using `any` rather than
      // `in` because the latter silently produces empty results in some
      // Mapbox GL JS versions when fed a literal-wrapped array.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const WORLDVIEW_FILTER: any = [
        "any",
        ["==", ["get", "worldview"], "all"],
        ["==", ["get", "worldview"], "US"],
      ];

      map.addLayer({
        id: "country-fill", type: "fill",
        source: "country-boundaries", "source-layer": "country_boundaries",
        filter: WORLDVIEW_FILTER,
        paint:  { "fill-color": "#000000", "fill-opacity": 0 },
      }, firstSymbol);
      map.addLayer({
        id: "country-outline", type: "line",
        source: "country-boundaries", "source-layer": "country_boundaries",
        filter: WORLDVIEW_FILTER,
        paint:  { "line-color": "#000000", "line-width": 1.2, "line-opacity": 0 },
      }, firstSymbol);

      // Cases source with clustering ────────────────────────────────────────
      map.addSource("cases", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true,
        clusterMaxZoom: 8,
        clusterRadius: 50,
      });

      // Cluster glow
      map.addLayer({
        id: "cluster-glow", type: "circle", source: "cases",
        filter: ["has", "point_count"],
        paint: {
          "circle-radius": ["step", ["get", "point_count"], 24, 10, 32, 50, 42],
          "circle-color":  "#C92A4F",
          "circle-opacity": 0.10,
        },
      });
      // Cluster main — color stepped by count (DESIGN_DOC §5.4)
      map.addLayer({
        id: "clusters", type: "circle", source: "cases",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step", ["get", "point_count"],
            "#FFB84D", 10, "#FF6B6B", 50, "#C92A4F",
          ],
          "circle-radius": ["step", ["get", "point_count"], 16, 10, 22, 50, 28],
          "circle-stroke-width": 2,
          "circle-stroke-color": "rgba(255,255,255,0.15)",
          "circle-blur": 0.15,
        },
      });
      // Cluster count
      map.addLayer({
        id: "cluster-count", type: "symbol", source: "cases",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["DIN Offc Pro Bold", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
        paint: { "text-color": "#E8EDF7" },
      });

      // Single point glow
      map.addLayer({
        id: "point-glow", type: "circle", source: "cases",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color":   ["get", "color"],
          "circle-radius":  ["interpolate", ["linear"], ["zoom"], 3, 11, 10, 20],
          "circle-opacity": 0.18,
        },
      });
      // Single point
      map.addLayer({
        id: "unclustered-case", type: "circle", source: "cases",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color":        ["get", "color"],
          "circle-radius":       ["interpolate", ["linear"], ["zoom"], 3, 6, 10, 10],
          "circle-stroke-color": "rgba(255,255,255,0.5)",
          "circle-stroke-width": 1.5,
          "circle-opacity":      1,
        },
      });

      // ── News-mention markers (per-country centroid) ──────────────────────
      // Hollow neutral circles, visually distinct from the colored confirmed
      // markers above. One marker per country, regardless of how many news
      // articles came in.
      map.addSource("mentions", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      // Outer halo so the hollow ring stays visible against the dark map
      map.addLayer({
        id: "mention-halo", type: "circle", source: "mentions",
        paint: {
          "circle-color":   "#5BC0EB",
          "circle-radius":  ["interpolate", ["linear"], ["zoom"], 1, 14, 6, 22],
          "circle-opacity": 0.10,
        },
      });
      // Hollow centroid marker
      map.addLayer({
        id: "mention-marker", type: "circle", source: "mentions",
        paint: {
          "circle-color":        "rgba(91,192,235,0.10)",
          "circle-stroke-color": "#5BC0EB",
          "circle-stroke-width": 2,
          "circle-radius":       ["interpolate", ["linear"], ["zoom"], 1, 10, 6, 16],
          "circle-opacity":      1,
        },
      });
      // Article-count text inside the marker
      map.addLayer({
        id: "mention-count", type: "symbol", source: "mentions",
        layout: {
          "text-field": ["get", "count"],
          "text-font":  ["DIN Offc Pro Bold", "Arial Unicode MS Bold"],
          "text-size":  11,
        },
        paint: {
          "text-color":      "#5BC0EB",
          "text-halo-color": "rgba(10,14,26,0.85)",
          "text-halo-width": 1.5,
        },
      });

      // ── Exposure markers (per-country surveillance follow-up) ──────────
      // Subdued teal/grey dashed ring — visually distinct from confirmed
      // markers (red/orange) and mention markers (cyan). Renders ABOVE the
      // country choropleth so it remains clickable when the country is also
      // confirmed-shaded.
      map.addSource("exposure", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "exposure-halo", type: "circle", source: "exposure",
        paint: {
          "circle-color":   "#7BA0A8",
          "circle-radius":  ["interpolate", ["linear"], ["zoom"], 1, 12, 6, 18],
          "circle-opacity": 0.10,
        },
      });
      map.addLayer({
        id: "exposure-marker", type: "circle", source: "exposure",
        paint: {
          "circle-color":        "rgba(123,160,168,0.08)",
          "circle-stroke-color": "#7BA0A8",
          "circle-stroke-width": 1.5,
          "circle-radius":       ["interpolate", ["linear"], ["zoom"], 1, 8, 6, 13],
          "circle-opacity":      1,
        },
      });
      map.addLayer({
        id: "exposure-label", type: "symbol", source: "exposure",
        layout: {
          "text-field": "👁",
          "text-size":  ["interpolate", ["linear"], ["zoom"], 1, 9, 6, 13],
          "text-allow-overlap": true,
        },
        paint: {
          "text-color":      "#7BA0A8",
          "text-halo-color": "rgba(10,14,26,0.85)",
          "text-halo-width": 1.5,
        },
      });

      for (const layer of ["clusters", "unclustered-case", "mention-marker", "exposure-marker"]) {
        map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; });
      }

      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const clusterId = features[0]?.properties?.cluster_id as number | undefined;
        if (!clusterId) return;
        const src = map.getSource("cases") as mapboxgl.GeoJSONSource;
        src.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom == null) return;
          map.easeTo({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            center: (features[0].geometry as any).coordinates as [number, number],
            zoom,
          });
        });
      });

      map.on("click", "unclustered-case", (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (!id) return;
        const r = reportByIdRef.current.get(id);
        if (!r) return;
        onSelectConfirmedRef.current?.(r);
        // Nudge map ~120px left so the marker isn't behind the drawer (DESIGN §5.5)
        const projected = map.project([r.lng, r.lat]);
        map.easeTo({
          center: map.unproject([projected.x + 60, projected.y]),
          zoom:   Math.max(map.getZoom(), 5),
          duration: 800,
        });
      });

      // ── Mention-marker click → open mentions drawer ──────────────────────
      map.on("click", "mention-marker", (e) => {
        const iso = e.features?.[0]?.properties?.iso as string | undefined;
        if (!iso) return;
        const country = countryMentionsRef.current.get(iso);
        if (!country) return;
        onSelectMentionsRef.current?.(country);
        // Same drawer-nudge treatment as confirmed markers
        const projected = map.project(country.centroid);
        map.easeTo({
          center: map.unproject([projected.x + 60, projected.y]),
          zoom:   Math.max(map.getZoom(), 4),
          duration: 800,
        });
      });

      // ── Exposure-marker click → open exposure drawer ─────────────────────
      map.on("click", "exposure-marker", (e) => {
        const iso = e.features?.[0]?.properties?.iso as string | undefined;
        if (!iso) return;
        const country = countryExposureRef.current.get(iso);
        if (!country) return;
        onSelectExposureRef.current?.(country);
        const projected = map.project(country.centroid);
        map.easeTo({
          center: map.unproject([projected.x + 60, projected.y]),
          zoom:   Math.max(map.getZoom(), 4),
          duration: 800,
        });
      });

      // ── Country hover popup — shows aggregated case totals per country ──
      const popup = new mapboxgl.Popup({
        closeButton:  false,
        closeOnClick: false,
        offset:       12,
      });
      hoverPopupRef.current = popup;

      map.on("mousemove", "country-fill", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const iso  = (f.properties?.iso_3166_1 as string) ?? "";
        const name = (f.properties?.name_en as string)
                  ?? (f.properties?.name as string)
                  ?? iso;
        const stats = countryStatsRef.current.get(iso);
        if (!stats) {
          popup.remove();
          return;
        }
        map.getCanvas().style.cursor = "pointer";
        popup
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="min-width:160px">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                <span style="
                  width:6px;height:6px;border-radius:50%;
                  background:${STATUS_COLOR[stats.topStatus] ?? "#5BC0EB"}
                "></span>
                <span style="font-size:12px;font-weight:600;color:#E8EDF7">${name}</span>
                <span style="
                  margin-left:auto;font-size:10px;color:#A3AECF;
                  font-family:'JetBrains Mono',ui-monospace,monospace
                ">${iso}</span>
              </div>
              <div style="font-size:18px;font-weight:600;color:#E8EDF7;font-variant-numeric:tabular-nums">
                ${stats.totalCases.toLocaleString()}
                <span style="font-size:11px;font-weight:400;color:#A3AECF;margin-left:4px">
                  case${stats.totalCases === 1 ? "" : "s"}
                </span>
              </div>
              <div style="font-size:11px;color:#6E7A9C;margin-top:2px">
                ${stats.reportCount} report${stats.reportCount === 1 ? "" : "s"}
                · worst: ${STATUS_LABEL[stats.topStatus] ?? stats.topStatus}
              </div>
            </div>
          `)
          .addTo(map);
      });
      map.on("mouseleave", "country-fill", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });

      setMapReady(true);
    });

    mapRef.current = map;

    // ── Container ResizeObserver — keep the canvas matched to its parent
    // so the filter rail expanding or the drawer opening re-flows the map
    // instead of leaving black bars or clipping. Mapbox needs an explicit
    // .resize() call whenever its container's box changes.
    // Track rAF handles so we can cancel any pending resize calls during
    // cleanup. Without this, an in-flight rAF can fire after map.remove()
    // and crash with "Cannot set properties of undefined (setting 'width')".
    let pendingRaf: number | null = null;
    let disposed = false;

    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (pendingRaf != null) cancelAnimationFrame(pendingRaf);
        pendingRaf = requestAnimationFrame(() => {
          pendingRaf = null;
          // Guard: skip if the component unmounted between scheduling and
          // executing this frame; or if the map was removed.
          if (disposed || !mapRef.current) return;
          mapRef.current.resize();
        });
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      disposed = true;
      if (pendingRaf != null) {
        cancelAnimationFrame(pendingRaf);
        pendingRaf = null;
      }
      resizeObserver?.disconnect();
      hoverPopupRef.current?.remove();
      hoverPopupRef.current = null;
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [mapboxToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    (map.getSource("cases") as mapboxgl.GeoJSONSource | undefined)?.setData(
      casesGeoJSON as Parameters<mapboxgl.GeoJSONSource["setData"]>[0],
    );
    (map.getSource("mentions") as mapboxgl.GeoJSONSource | undefined)?.setData(
      mentionsGeoJSON as Parameters<mapboxgl.GeoJSONSource["setData"]>[0],
    );
    (map.getSource("exposure") as mapboxgl.GeoJSONSource | undefined)?.setData(
      exposureGeoJSON as Parameters<mapboxgl.GeoJSONSource["setData"]>[0],
    );
  }, [casesGeoJSON, mentionsGeoJSON, exposureGeoJSON, mapReady]);

  // ── Sync country choropleth ───────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (!showCountryHeatmap || !countryExpressions) {
      map.setPaintProperty("country-fill",    "fill-opacity", 0);
      map.setPaintProperty("country-outline", "line-opacity", 0);
      return;
    }
    const { fillColor, fillOpacity, lineColor, lineOpacity } = countryExpressions;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    map.setPaintProperty("country-fill",    "fill-color",   fillColor   as any);
    map.setPaintProperty("country-fill",    "fill-opacity", fillOpacity as any);
    map.setPaintProperty("country-outline", "line-color",   lineColor   as any);
    map.setPaintProperty("country-outline", "line-opacity", lineOpacity as any);
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }, [countryExpressions, mapReady, showCountryHeatmap]);

  if (!mapboxToken) {
    return (
      <div
        className="flex h-full items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      >
        <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
          Mapbox token not configured.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
