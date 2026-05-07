import Link from "next/link";
import { Activity, ShieldAlert } from "lucide-react";

import { brand, disclaimer, footer } from "@/lib/copy";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="space-y-4">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-zinc-100"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-400">
                <Activity className="h-4 w-4" strokeWidth={2.25} />
              </span>
              {brand.name}
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-zinc-400">
              {brand.shortDescription}
            </p>
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{disclaimer.long}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {footer.columns.map((column) => (
              <div key={column.heading} className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  {column.heading}
                </h3>
                <ul className="space-y-2">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-zinc-500 transition-colors hover:text-zinc-200"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-zinc-500">{footer.copyright}</p>
          <p className="text-xs text-zinc-500">{disclaimer.short}</p>
        </div>
      </div>
    </footer>
  );
}
