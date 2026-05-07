import { stats } from "@/lib/copy";

export function StatsBar() {
  return (
    <section className="border-b border-border bg-card/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden rounded-none px-0 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-start gap-1 px-4 py-6 sm:px-6 sm:py-8"
          >
            <span className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
              {stat.value}
            </span>
            <span className="text-xs uppercase tracking-wider text-zinc-500">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
