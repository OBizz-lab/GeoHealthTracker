"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { MapPinned } from "lucide-react";

import { CaseDrawer } from "@/components/map/case-drawer";
import { Badge } from "@/components/ui/badge";
import { map as mapCopy } from "@/lib/copy";
import { colors, statusLabels } from "@/lib/design-tokens";
import type { Report } from "@/lib/types";

interface MapViewProps {
  reports: Report[];
  mapboxToken: string | undefined;
}

const MAP_STYLE = "mapbox://styles/mapbox/dark-v11";
const DEFAULT_CENTER: [number, number] = [10, 20];
const DEFAULT_ZOOM = 1.6;

export function MapView({ reports, mapboxToken }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selected, setSelected] = useState<Report | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const reportById = useMemo(() => {
    const m = new Map<string, Report>();
    reports.forEach((r) => m.set(r.id, r));
    return m;
  }, [reports]);

  useEffect(() => {
    if (!mapboxToken) return;
    if (!containerRef.current) return;
    if (mapRef.current) return;

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      projection: "mercator",
      attributionControl: false,
    });

    map.addControl(new mapboxgl.AttributionControl({ compact: true }));
    map.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: false }),
      "bottom-right",
    );

    map.on("load", () => setMapReady(true));
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [mapboxToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (reports.length === 0) return;

    reports.forEach((report) => {
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", `Report in ${report.location_name}`);
      el.style.width = "16px";
      el.style.height = "16px";
      el.style.borderRadius = "999px";
      el.style.background = colors.status[report.status];
      el.style.border = "2px solid rgba(0,0,0,0.6)";
      el.style.boxShadow = `0 0 0 4px ${colors.status[report.status]}33`;
      el.style.cursor = "pointer";
      el.style.padding = "0";
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const r = reportById.get(report.id);
        if (r) {
          setSelected(r);
          map.flyTo({ center: [r.lng, r.lat], zoom: 5, duration: 900 });
        }
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([report.lng, report.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });

    const bounds = new mapboxgl.LngLatBounds();
    reports.forEach((r) => bounds.extend([r.lng, r.lat]));
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 40, duration: 0, maxZoom: 4 });
    }
  }, [reports, mapReady, reportById]);

  if (!mapboxToken) {
    return (
      <MapFallback
        reports={reports}
        onSelect={setSelected}
        selected={selected}
      />
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <CaseDrawer report={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function MapFallback({
  reports,
  selected,
  onSelect,
}: {
  reports: Report[];
  selected: Report | null;
  onSelect: (r: Report | null) => void;
}) {
  return (
    <div className="relative flex h-full w-full">
      <div className="flex flex-1 flex-col">
        <div className="flex items-start gap-3 border-b border-border bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <MapPinned className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{mapCopy.noToken}</p>
        </div>
        <div className="flex-1 overflow-auto bg-background">
          <ul className="mx-auto max-w-3xl divide-y divide-border">
            {reports.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onSelect(r)}
                  className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-card"
                >
                  <span
                    className="mt-1.5 h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: colors.status[r.status] }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-100">
                      {r.location_name},{" "}
                      <span className="text-zinc-400">{r.country}</span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {r.notes}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {statusLabels[r.status]}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <CaseDrawer report={selected} onClose={() => onSelect(null)} />
    </div>
  );
}
