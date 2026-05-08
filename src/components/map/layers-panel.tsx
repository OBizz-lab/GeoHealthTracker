"use client";

import { useState } from "react";
import { Layers, ChevronDown, Globe } from "lucide-react";
import { colors, statusLabels } from "@/lib/design-tokens";
import type { ReportStatus } from "@/lib/types";

const STATUS_ORDER: ReportStatus[] = [
  "confirmed", "fatal", "suspected", "reported", "resolved",
];

interface LayersPanelProps {
  activeStatuses:     Set<ReportStatus>;
  onToggle:           (status: ReportStatus) => void;
  showCountryHeatmap: boolean;
  onToggleHeatmap:    () => void;
  totalVisible:       number;
  totalAll:           number;
}

export function LayersPanel({
  activeStatuses,
  onToggle,
  showCountryHeatmap,
  onToggleHeatmap,
  totalVisible,
  totalAll,
}: LayersPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="pointer-events-auto w-44 rounded-xl border border-[#27314a] bg-[#111827]/95 shadow-2xl backdrop-blur-md">
      {/* Header / collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5"
      >
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
            Layers
          </span>
        </div>
        <ChevronDown
          className={[
            "h-3.5 w-3.5 text-zinc-600 transition-transform duration-200",
            collapsed ? "-rotate-90" : "",
          ].join(" ")}
        />
      </button>

      {!collapsed && (
        <div className="border-t border-[#27314a] px-2 pb-3 pt-2">
          {/* Status toggles */}
          <p className="mb-1.5 px-1.5 text-[9px] font-semibold uppercase tracking-widest text-zinc-600">
            Status
          </p>
          <ul className="space-y-0.5">
            {STATUS_ORDER.map((status) => {
              const active = activeStatuses.has(status);
              return (
                <li key={status}>
                  <button
                    type="button"
                    onClick={() => onToggle(status)}
                    aria-pressed={active}
                    className={[
                      "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-opacity",
                      active ? "opacity-100" : "opacity-30 hover:opacity-60",
                    ].join(" ")}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full ring-2 ring-black/40"
                      style={{ backgroundColor: colors.status[status] }}
                    />
                    <span className="text-zinc-200">{statusLabels[status]}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Overlay toggles */}
          <div className="mt-3 border-t border-[#27314a]/60 pt-3">
            <p className="mb-1.5 px-1.5 text-[9px] font-semibold uppercase tracking-widest text-zinc-600">
              Overlays
            </p>
            <button
              type="button"
              onClick={onToggleHeatmap}
              className={[
                "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-opacity",
                showCountryHeatmap ? "opacity-100" : "opacity-30 hover:opacity-60",
              ].join(" ")}
            >
              <Globe className="h-3.5 w-3.5 shrink-0 text-blue-400" />
              <span className="text-zinc-200">Country fill</span>
            </button>
          </div>

          {/* Signal count */}
          <p className="mt-3 border-t border-[#27314a]/60 px-2 pt-3 text-[10px] tabular-nums text-zinc-600">
            {totalVisible === totalAll
              ? `${totalAll} signals`
              : `${totalVisible} / ${totalAll} shown`}
          </p>
        </div>
      )}
    </div>
  );
}
