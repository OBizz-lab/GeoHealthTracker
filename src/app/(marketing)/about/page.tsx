import { ShieldAlert } from "lucide-react";

import { SiteFooter } from "@/components/marketing/site-footer";
import { Separator } from "@/components/ui/separator";
import { about, disclaimer } from "@/lib/copy";

export const metadata = {
  title: "About — GeoHealthTracker",
  description: about.intro,
};

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
            {about.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-400">
            {about.intro}
          </p>
          <Separator className="my-10 bg-border" />
          <div className="space-y-10">
            {about.sections.map((section) => (
              <article key={section.heading}>
                <h2 className="text-xl font-semibold tracking-tight text-zinc-100">
                  {section.heading}
                </h2>
                <p className="mt-3 text-zinc-400 leading-relaxed">
                  {section.body}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-12 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{disclaimer.long}</p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
