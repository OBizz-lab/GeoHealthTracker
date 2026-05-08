"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

import { CaseDrawer } from "@/components/map/case-drawer";
import type { Report, ReportStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Constants — DESIGN_DOC §5.2 / §5.4
// ---------------------------------------------------------------------------
const MAP_STYLE = "mapbox://styles/mapbox/dark-v11";
const INIT_CENTER: [number, number] = [-98.5, 39.5]; // Continental US
const INIT_ZOOM = 3.2;

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
        color:      STATUS_COLOR[r.status] ?? "#5BC0EB",
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

  const fillColor: unknown[]   = ["match", ["get", "iso_3166_1"]];
  const fillOpacity: unknown[] = ["match", ["get", "iso_3166_1"]];
  const lineColor: unknown[]   = ["match", ["get", "iso_3166_1"]];
  const lineOpacity: unknown[] = ["match", ["get", "iso_3166_1"]];

  countryStatus.forEach((status, iso) => {
    fillColor.push(iso, FILL_COLOR[status]);
    fillOpacity.push(iso, 0.18);
    lineColor.push(iso, FILL_COLOR[status]);
    lineOpacity.push(iso, 0.7);
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

  useEffect(() => {
    const m = new Map<string, Report>();
    reports.forEach((r) => m.set(r.id, r));
    reportByIdRef.current = m;
  }, [reports]);

  const geoJSON            = useMemo(() => toGeoJSON(reports), [reports]);
  const countryExpressions = useMemo(() => buildCountryExpressions(reports), [reports]);

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
    map.addControl(new mapboxgl.FullscreenControl(), "top-right");

    map.on("load", () => {
      const firstSymbol = map.getStyle().layers.find((l) => l.type === "symbol")?.id;

      // Country choropleth ─────────────────────────────────────────────────
      map.addSource("country-boundaries", {
        type: "vector",
        url:  "mapbox://mapbox.country-boundaries-v1",
      });
      map.addLayer({
        id: "country-fill", type: "fill",
        source: "country-boundaries", "source-layer": "country_boundaries",
        filter: ["in", ["get", "worldview"], ["literal", ["all", "US"]]],
        paint: { "fill-color": "#000000", "fill-opacity": 0 },
      }, firstSymbol);
      map.addLayer({
        id: "country-outline", type: "line",
        source: "country-boundaries", "source-layer": "country_boundaries",
        filter: ["in", ["get", "worldview"], ["literal", ["all", "US"]]],
        paint: { "line-color": "#000000", "line-width": 1.2, "line-opacity": 0 },
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

      for (const layer of ["clusters", "unclustered-case"]) {
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
        setSelected(r);
        // Nudge map ~120px left so the marker isn't behind the drawer (DESIGN §5.5)
        const projected = map.project([r.lng, r.lat]);
        map.easeTo({
          center: map.unproject([projected.x + 60, projected.y]),
          zoom:   Math.max(map.getZoom(), 5),
          duration: 800,
        });
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

  // ── Sync data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    (map.getSource("cases") as mapboxgl.GeoJSONSource | undefined)?.setData(
      geoJSON as Parameters<mapboxgl.GeoJSONSource["setData"]>[0],
    );
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
    /* eslint-disable @typescript-eslint/no-explicit-any */
    map.setPaintProperty("country-fill",    "fill-color",   fillColor   as any);
    map.setPaintProperty("country-fill",    "fill-opacity", fillOpacity as any);
    map.setPaintProperty("country-outline", "line-color",   lineColor   as any);
    map.setPaintProperty("country-outline", "line-opacity", lineOpacity as any);
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }, [countryExpressions, mapReady, showCountryHeatmap]);

  // ── Esc closes drawer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!selected) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

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
      <CaseDrawer report={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
