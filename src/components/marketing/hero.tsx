import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { hero } from "@/lib/copy";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 ghx-grid-pattern" aria-hidden />
      <div className="absolute inset-0 ghx-radial-glow" aria-hidden />
      <div className="relative mx-auto flex max-w-7xl flex-col items-start px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-blue-300">
          <MapPin className="h-3 w-3" />
          {hero.eyebrow}
        </span>
        <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
          {hero.title}
        </h1>
        <p className="mt-6 max-w-2xl text-balance text-base leading-relaxed text-zinc-400 sm:text-lg">
          {hero.subtitle}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={hero.ctaPrimary.href}
            className={buttonVariants({ size: "lg" })}
          >
            {hero.ctaPrimary.label}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
          <Link
            href={hero.ctaSecondary.href}
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            {hero.ctaSecondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
