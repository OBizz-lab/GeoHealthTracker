"use client";

export type TimeRange = "30d" | "6m" | "1y" | "all";

const TIME_OPTIONS: { label: string; value: TimeRange }[] = [
  { label: "30d", value: "30d" },
  { label: "6m",  value: "6m"  },
  { label: "1y",  value: "1y"  },
  { label: "All", value: "all" },
];

interface StatsBarProps {
  totalSignals:      number;
  countriesAffected: number;
  totalCases:        number;
  timeRange:         TimeRange;
  onTimeRangeChange: (t: TimeRange) => void;
}

export function StatsBar({
  totalSignals,
  countriesAffected,
  totalCases,
  timeRange,
  onTimeRangeChange,
}: StatsBarProps) {
  return (
    <div className="pointer-events-auto flex w-full max-w-2xl items-center gap-3 rounded-xl border border-[#27314a] bg-[#111827]/95 px-4 py-2.5 shadow-2xl backdrop-blur-md text-xs">
      {/* Live dot */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
      </span>

      {/* Stats */}
      <span className="font-semibold text-zinc-100">
        {countriesAffected} <span className="font-normal text-zinc-500">countries</span>
      </span>
      <span className="text-[#27314a]">|</span>
      <span className="text-zinc-300">
        {totalSignals} <span className="text-zinc-500">signals</span>
      </span>
      <span className="text-[#27314a]">|</span>
      <span className="text-zinc-300">
        {totalCases.toLocaleString()} <span className="text-zinc-500">cases</span>
      </span>

      {/* Time filter — pushed to the right */}
      <div className="ml-auto flex items-center gap-0.5 rounded-lg border border-[#27314a] bg-[#0a0f1e]/80 p-0.5">
        {TIME_OPTIONS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => onTimeRangeChange(value)}
            className={[
              "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
              timeRange === value
                ? "bg-blue-600 text-white shadow"
                : "text-zinc-500 hover:text-zinc-200",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
