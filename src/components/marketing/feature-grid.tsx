import {
  BellRing,
  Clock,
  Code2,
  Globe2,
  Lock,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { features } from "@/lib/copy";

const iconMap: Record<string, LucideIcon> = {
  Globe2,
  ShieldCheck,
  BellRing,
  Clock,
  Code2,
  Lock,
};

export function FeatureGrid() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            Built for analysts who need answers fast
          </h2>
          <p className="mt-4 text-zinc-400">
            Everything you need to monitor, investigate, and share what's
            happening — without the noise of social-media rumor cycles.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = iconMap[feature.icon] ?? Globe2;
            return (
              <Card
                key={feature.title}
                className="border-border bg-card/60 transition-colors hover:bg-card"
              >
                <CardContent className="flex flex-col gap-4 p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-500/10 text-blue-400">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-medium text-zinc-100">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
