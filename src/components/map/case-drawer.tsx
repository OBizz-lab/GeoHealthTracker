"use client";

import { format, parseISO } from "date-fns";
import {
  CalendarDays,
  ExternalLink,
  MapPin,
  Stethoscope,
  Users,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { colors, severityLabels, statusLabels } from "@/lib/design-tokens";
import type { Report } from "@/lib/types";

interface CaseDrawerProps {
  report: Report | null;
  onClose: () => void;
}

export function CaseDrawer({ report, onClose }: CaseDrawerProps) {
  if (!report) return null;

  const reportedDate = (() => {
    try {
      return format(parseISO(report.reported_date), "MMM d, yyyy");
    } catch {
      return report.reported_date;
    }
  })();

  return (
    <aside
      role="dialog"
      aria-label={`Report details for ${report.location_name}`}
      className="pointer-events-auto absolute right-0 top-0 z-30 flex h-full w-full max-w-md flex-col border-l border-border bg-card/95 shadow-2xl backdrop-blur"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border p-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: colors.status[report.status] }}
              aria-hidden
            />
            <Badge
              variant="outline"
              className="border-border bg-background/60 text-xs uppercase tracking-wider"
            >
              {statusLabels[report.status]}
            </Badge>
            <Badge
              variant="outline"
              className="border-border bg-background/60 text-xs"
              style={{ color: colors.severity[report.severity] }}
            >
              {severityLabels[report.severity]} severity
            </Badge>
          </div>
          <h2 className="mt-3 truncate text-xl font-semibold tracking-tight text-zinc-50">
            {report.location_name}
          </h2>
          <p className="mt-0.5 text-sm text-zinc-400">
            {report.state_province
              ? `${report.state_province}, ${report.country}`
              : report.country}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close report details"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 p-5">
          <DataRow
            icon={<CalendarDays className="h-4 w-4" />}
            label="Reported"
            value={reportedDate}
          />
          <DataRow
            icon={<Users className="h-4 w-4" />}
            label="Reported case count"
            value={report.case_count.toLocaleString()}
          />
          {report.condition ? (
            <DataRow
              icon={<Stethoscope className="h-4 w-4" />}
              label="Condition"
              value={report.condition}
            />
          ) : null}
          <DataRow
            icon={<MapPin className="h-4 w-4" />}
            label="Coordinates"
            value={`${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}`}
          />

          <Separator className="bg-border" />

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Notes
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-200">
              {report.notes}
            </p>
          </div>

          <Separator className="bg-border" />

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Source
            </h3>
            <p className="mt-2 text-sm text-zinc-200">{report.source_name}</p>
            {report.source_url ? (
              <a
                href={report.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "mt-3",
                })}
              >
                Open source
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            ) : null}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}

function DataRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-zinc-300">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-zinc-500">
          {label}
        </p>
        <p className="mt-0.5 text-sm text-zinc-100">{value}</p>
      </div>
    </div>
  );
}
