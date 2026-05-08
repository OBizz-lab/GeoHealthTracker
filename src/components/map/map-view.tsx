"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

import { CaseDrawer } from "@/components/map/case-drawer";
import type { Report, ReportStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAP_STYLE = "mapbox://styles/mapbox/dark-v11";
const INIT_CENTER: [number, number] = [-20, 15];
const INIT_ZOOM = 1.8;

const STATUS_COLOR: Record<ReportStatus, string> = {
  fatal:     "#ef4444",
  confirmed: "#f97316",
  suspected: "#f59e0b",
  reported:  "#3b82f6",
  resolved:  "#22c55e",
};

// Softer fill palette for country choropleth (slightly less saturated so they
// read as background context rather than foreground data)
const FILL_COLOR: Record<ReportStatus, string> = {
  fatal:     "#dc2626",
  confirmed: "#ea580c",
  suspected: "#d97706",
  reported:  "#2563eb",
  resolved:  "#16a34a",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toGeoJSON(reports: Report[]) {
  return {
    type: "FeatureCollection" as const,
    features: reports.map((r) => ({
      type: "Feature" as const,
      properties: {
        id:         r.id,
        status:     r.status,
        color:      STATUS_COLOR[r.status] ?? "#3b82f6",
        case_count: r.case_count,
      },
      geometry: { type: "Point" as const, coordinates: [r.lng, r.lat] as [number, number] },
    })),
  };
}

function buildCountryExpressions(reports: Report[]) {
  const rank: Record<string, number> = {
    resolved: 0, reported: 1, suspected: 2, confirmed: 3, fatal: 4,
  };
  const countryStatus = new Map<string, ReportStatus>();
  for (const r of reports) {
    if (!r.country || r.country === "ZZ") continue;
    const prev = countryStatus.get(r.country);
    if (!prev || rank[r.status] > rank[prev]) countryStatus.set(r.country, r.status);
  }
  if (countryStatus.size === 0) return null;

  // match expression: ["match", field, val1, result1, ..., fallback]
  const fillColor: unknown[]      = ["match", ["get", "iso_3166_1"]];
  const fillOpacity: unknown[]    = ["match", ["get", "iso_3166_1"]];
  const lineColor: unknown[]      = ["match", ["get", "iso_3166_1"]];
  const lineOpacity: unknown[]    = ["match", ["get", "iso_3166_1"]];

  countryStatus.forEach((status, iso) => {
    fillColor.push(iso,    FILL_COLOR[status]);
    fillOpacity.push(iso,  0.30);
    lineColor.push(iso,    FILL_COLOR[status]);
    lineOpacity.push(iso,  0.85);
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
}

export function MapView({ reports, mapboxToken, showCountryHeatmap }: MapViewProps) {
  const containerRef    = useRef<HTMLDivElement | null>(null);
  const mapRef          = useRef<mapboxgl.Map | null>(null);
  const reportByIdRef   = useRef<Map<string, Report>>(new Map());
  const [selected, setSelected] = useState<Report | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Keep reportById ref fresh without triggering re-renders
  useEffect(() => {
    const m = new Map<string, Report>();
    reports.forEach((r) => m.set(r.id, r));
    reportByIdRef.current = m;
  }, [reports]);

  const geoJSON            = useMemo(() => toGeoJSON(reports), [reports]);
  const countryExpressions = useMemo(() => buildCountryExpressions(reports), [reports]);

  // ── Init map once ────────────────────────────────────────────────────────
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
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      // Insert fill layers below the first symbol (label) layer
      const firstSymbol = map.getStyle().layers.find((l) => l.type === "symbol")?.id;

      // ── Country choropleth ─────────────────────────────────────────────
      map.addSource("country-boundaries", {
        type: "vector",
        url:  "mapbox://mapbox.country-boundaries-v1",
      });
      map.addLayer({
        id:           "country-fill",
        type:         "fill",
        source:       "country-boundaries",
        "source-layer": "country_boundaries",
        filter:       ["in", ["get", "worldview"], ["literal", ["all", "US"]]],
        paint:        { "fill-color": "#000000", "fill-opacity": 0 },
      }, firstSymbol);
      map.addLayer({
        id:           "country-outline",
        type:         "line",
        source:       "country-boundaries",
        "source-layer": "country_boundaries",
        filter:       ["in", ["get", "worldview"], ["literal", ["all", "US"]]],
        paint:        { "line-color": "#000000", "line-width": 1.5, "line-opacity": 0 },
      }, firstSymbol);

      // ── Reports cluster source ─────────────────────────────────────────
      map.addSource("reports", {
        type:         "geojson",
        data:         { type: "FeatureCollection", features: [] },
        cluster:      true,
        clusterMaxZoom: 9,
        clusterRadius:  50,
      });

      // Outer glow ring for clusters
      map.addLayer({
        id:     "cluster-glow",
        type:   "circle",
        source: "reports",
        filter: ["has", "point_count"],
        paint:  {
          "circle-radius":  ["step", ["get", "point_count"], 28, 5, 36, 15, 46],
          "circle-color":   "#ef4444",
          "circle-opacity": 0.10,
        },
      });
      // Cluster main circle
      map.addLayer({
        id:     "clusters",
        type:   "circle",
        source: "reports",
        filter: ["has", "point_count"],
        paint:  {
          "circle-color": [
            "step", ["get", "point_count"],
            "#152038", 5, "#1e3055", 15, "#450a0a",
          ],
          "circle-radius": ["step", ["get", "point_count"], 18, 5, 24, 15, 32],
          "circle-stroke-width": 2,
          "circle-stroke-color": [
            "step", ["get", "point_count"],
            "#3b82f6", 5, "#f59e0b", 15, "#ef4444",
          ],
          "circle-opacity": 0.95,
        },
      });
      // Cluster count label
      map.addLayer({
        id:     "cluster-count",
        type:   "symbol",
        source: "reports",
        filter: ["has", "point_count"],
        layout: {
          "text-field":        ["get", "point_count_abbreviated"],
          "text-font":         ["DIN Offc Pro Bold", "Arial Unicode MS Bold"],
          "text-size":         13,
        },
        paint: { "text-color": "#f4f4f5" },
      });
      // Single-point outer glow
      map.addLayer({
        id:     "point-glow",
        type:   "circle",
        source: "reports",
        filter: ["!", ["has", "point_count"]],
        paint:  {
          "circle-color":   ["get", "color"],
          "circle-radius":  ["interpolate", ["linear"], ["zoom"], 2, 12, 10, 22],
          "circle-opacity": 0.18,
        },
      });
      // Single point
      map.addLayer({
        id:     "unclustered-point",
        type:   "circle",
        source: "reports",
        filter: ["!", ["has", "point_count"]],
        paint:  {
          "circle-color":        ["get", "color"],
          "circle-radius":       ["interpolate", ["linear"], ["zoom"], 2, 5, 10, 10],
          "circle-stroke-color": "rgba(0,0,0,0.65)",
          "circle-stroke-width": 2,
          "circle-opacity":      0.95,
        },
      });

      // ── Cursors ────────────────────────────────────────────────────────
      for (const layer of ["clusters", "unclustered-point"]) {
        map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; });
      }

      // ── Cluster click → zoom in ────────────────────────────────────────
      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const clusterId = features[0]?.properties?.cluster_id as number | undefined;
        if (!clusterId) return;
        const src = map.getSource("reports") as mapboxgl.GeoJSONSource;
        src.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom == null) return;
          map.easeTo({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            center: (features[0].geometry as any).coordinates as [number, number],
            zoom,
          });
        });
      });

      // ── Single point click → drawer ────────────────────────────────────
      map.on("click", "unclustered-point", (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (!id) return;
        const r = reportByIdRef.current.get(id);
        if (!r) return;
        setSelected(r);
        map.flyTo({ center: [r.lng, r.lat], zoom: Math.max(map.getZoom(), 5), duration: 800 });
      });

      setMapReady(true);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [mapboxToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync GeoJSON ─────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    (map.getSource("reports") as mapboxgl.GeoJSONSource | undefined)?.setData(geoJSON as Parameters<mapboxgl.GeoJSONSource["setData"]>[0]);
  }, [geoJSON, mapReady]);

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.setPaintProperty("country-fill",    "fill-color",   fillColor   as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.setPaintProperty("country-fill",    "fill-opacity", fillOpacity as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.setPaintProperty("country-outline", "line-color",   lineColor   as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.setPaintProperty("country-outline", "line-opacity", lineOpacity as any);
  }, [countryExpressions, mapReady, showCountryHeatmap]);

  // ── No token fallback ─────────────────────────────────────────────────────
  if (!mapboxToken) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0a0f1e]">
        <p className="text-sm text-zinc-500">Mapbox token not configured.</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <CaseDrawer report={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
