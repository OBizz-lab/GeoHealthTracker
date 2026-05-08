import { MapShell } from "@/components/map/map-shell";

export const metadata = {
  title: "Live Map — GeoHealthTracker",
  description:
    "Interactive global map of verified hantavirus cases sourced from WHO, ProMED, and government health agencies.",
};

export default function MapPage() {
  return (
    <main className="relative flex-1 overflow-hidden">
      <div className="absolute inset-0">
        <MapShell mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN} />
      </div>
    </main>
  );
}
