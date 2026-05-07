import Link from "next/link";
import { Check } from "lucide-react";

import { SiteFooter } from "@/components/marketing/site-footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { pricingTiers } from "@/lib/copy";

export const metadata = {
  title: "Pricing — GeoHealthTracker",
  description: "Simple plans for citizens, researchers, and operations teams.",
};

export default function PricingPage() {
  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
              Simple, transparent pricing
            </h1>
            <p className="mt-4 text-lg text-zinc-400">
              Free for the public. Affordable for researchers. Custom for
              operations teams.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={
                  "relative flex flex-col border-border bg-card/60 " +
                  (tier.highlighted
                    ? "border-blue-500/40 ring-1 ring-blue-500/30"
                    : "")
                }
              >
                {tier.highlighted ? (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white hover:bg-blue-500">
                    Most popular
                  </Badge>
                ) : null}
                <CardContent className="flex flex-1 flex-col gap-6 p-6">
                  <div>
                    <h2 className="text-lg font-medium text-zinc-100">
                      {tier.name}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-400">
                      {tier.description}
                    </p>
                  </div>
                  <div className="text-3xl font-semibold tracking-tight text-zinc-50">
                    {tier.price}
                  </div>
                  <ul className="space-y-2 text-sm text-zinc-300">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-2">
                    <Link
                      href={tier.href}
                      className={
                        "inline-flex h-11 w-full items-center justify-center rounded-lg px-5 text-sm font-medium transition-colors " +
                        (tier.highlighted
                          ? "bg-blue-500 text-white hover:bg-blue-600"
                          : "border border-border bg-background/40 text-zinc-100 hover:bg-white/5")
                      }
                    >
                      {tier.cta}
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
