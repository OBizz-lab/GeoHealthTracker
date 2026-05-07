import { colors, statusLabels } from "@/lib/design-tokens";
import { map } from "@/lib/copy";
import type { ReportStatus } from "@/lib/types";

const statusOrder: ReportStatus[] = [
  "confirmed",
  "suspected",
  "reported",
  "resolved",
];

export function LegendPanel() {
  return (
    <div className="pointer-events-auto rounded-xl border border-border bg-card/90 p-4 shadow-2xl backdrop-blur">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
        {map.legend}
      </h3>
      <ul className="mt-3 space-y-2">
        {statusOrder.map((status) => (
          <li key={status} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 shrink-0 rounded-full ring-2 ring-black/40"
              style={{ backgroundColor: colors.status[status] }}
            />
            <span className="text-zinc-200">{statusLabels[status]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
