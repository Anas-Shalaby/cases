import { CheckCircle2, CircleDashed } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { NavLink } from "@/components/ui/nav-button";
import { formatDeadlineUrgency } from "@/lib/case-deadlines";
import type { ScheduleEvent } from "@/lib/case-schedule";
import { cn } from "@/lib/utils";

interface ScheduleEventItemProps {
  event: ScheduleEvent;
  compact?: boolean;
}

export function ScheduleEventItem({
  event,
  compact = false,
}: ScheduleEventItemProps) {
  const isPending = event.status === "pending";

  return (
    <div
      className={cn(
        "rounded-lg border p-2.5",
        isPending
          ? event.isPastDue
            ? "border-destructive/30 bg-destructive/5"
            : "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20"
          : "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20"
      )}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {isPending ? (
            <CircleDashed className="size-3.5 shrink-0 text-amber-600" />
          ) : (
            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
          )}
          <span className="text-xs font-medium">{event.label}</span>
        </div>
        <Badge
          variant="outline"
          className="shrink-0 text-[10px]"
        >
          {event.userRoleLabel}
        </Badge>
      </div>

      <NavLink
        href={`/cases/${event.caseId}`}
        className={cn(
          "block font-medium hover:text-primary hover:underline",
          compact ? "text-xs leading-snug" : "text-sm"
        )}
      >
        {event.caseName}
      </NavLink>

      {!compact && (
        <p className="text-muted-foreground mt-0.5 text-[11px]" dir="ltr">
          {event.caseNumber}
        </p>
      )}

      {isPending && event.daysUntil !== undefined && (
        <p
          className={cn(
            "mt-1.5 text-[11px] font-medium",
            event.isPastDue ? "text-destructive" : "text-amber-700 dark:text-amber-300"
          )}
        >
          {formatDeadlineUrgency(event.daysUntil)}
        </p>
      )}

      {!isPending && !compact && (
        <p className="text-muted-foreground mt-1.5 text-[11px]">تم الإنجاز</p>
      )}
    </div>
  );
}
