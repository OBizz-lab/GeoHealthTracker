import { MapShell } from "@/components/map/map-shell";

export default function HomePage() {
  return (
    <main className="relative flex-1 overflow-hidden">
      <div className="absolute inset-0">
        <MapShell mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN} />
      </div>
    </main>
  );
}
