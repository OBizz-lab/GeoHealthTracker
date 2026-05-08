import { MapShell } from "@/components/map/map-shell";
import { seedReports } from "@/lib/seed-data";

export const metadata = {
  title: "Live Map — GeoHealthTracker",
  description:
    "Interactive global map of verified, timestamped public health reports.",
};

export default function MapPage() {
  const reports = seedReports;
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  return (
    <main className="relative flex-1 overflow-hidden">
      <div className="absolute inset-0">
        <MapShell reports={reports} mapboxToken={mapboxToken} />
      </div>
    </main>
  );
}
