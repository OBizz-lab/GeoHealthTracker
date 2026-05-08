"use client";

import { colors, statusLabels } from "@/lib/design-tokens";
import { map } from "@/lib/copy";
import type { ReportStatus } from "@/lib/types";

const statusOrder: ReportStatus[] = [
  "confirmed",
  "suspected",
  "reported",
  "resolved",
];

interface LegendPanelProps {
  activeStatuses?: Set<ReportStatus>;
  onToggle?: (status: ReportStatus) => void;
  totalVisible?: number;
  totalAll?: number;
}

export function LegendPanel({
  activeStatuses,
  onToggle,
  totalVisible,
  totalAll,
}: LegendPanelProps) {
  const isInteractive = !!onToggle;

  return (
    <div className="pointer-events-auto rounded-xl border border-border bg-card/90 p-4 shadow-2xl backdrop-blur">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
        {map.legend}
      </h3>
      <ul className="mt-3 space-y-1.5">
        {statusOrder.map((status) => {
          const isActive = activeStatuses ? activeStatuses.has(status) : true;
          return (
            <li key={status}>
              {isInteractive ? (
                <button
                  type="button"
                  onClick={() => onToggle(status)}
                  className={[
                    "flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-sm transition-opacity",
                    isActive
                      ? "opacity-100"
                      : "opacity-35 hover:opacity-60",
                  ].join(" ")}
                  aria-pressed={isActive}
                  title={`${isActive ? "Hide" : "Show"} ${statusLabels[status]}`}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full ring-2 ring-black/40"
                    style={{ backgroundColor: colors.status[status] }}
                    aria-hidden
                  />
                  <span className="text-zinc-200">{statusLabels[status]}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 px-1.5 py-1 text-sm">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full ring-2 ring-black/40"
                    style={{ backgroundColor: colors.status[status] }}
                    aria-hidden
                  />
                  <span className="text-zinc-200">{statusLabels[status]}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {totalAll !== undefined && (
        <p className="mt-3 border-t border-border pt-3 text-xs text-zinc-500">
          {totalVisible === totalAll
            ? `${totalAll} reports`
            : `${totalVisible} of ${totalAll} shown`}
        </p>
      )}
    </div>
  );
}
