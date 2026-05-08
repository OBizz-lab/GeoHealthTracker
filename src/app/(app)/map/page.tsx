import { MapShell } from "@/components/map/map-shell";
import { brand } from "@/lib/copy";

export const metadata = {
  title: `Live Map — ${brand.name}`,
  description:
    "Interactive global map of verified hantavirus cases sourced from WHO, ProMED, CDC, ECDC, PAHO, and state health departments.",
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
