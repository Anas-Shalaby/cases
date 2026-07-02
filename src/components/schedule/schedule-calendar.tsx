"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { ScheduleDayDialog } from "@/components/schedule/schedule-day-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ARABIC_WEEKDAYS_SHORT,
  buildMonthCalendar,
  formatMonthYear,
  monthParam,
  shiftMonth,
  type MonthCalendarCell,
  type ScheduleEvent,
} from "@/lib/case-schedule";
import { cn } from "@/lib/utils";

interface ScheduleCalendarProps {
  year: number;
  month: number;
  events: ScheduleEvent[];
}

function DayCell({
  cell,
  onSelect,
}: {
  cell: MonthCalendarCell;
  onSelect: (date: string, events: ScheduleEvent[]) => void;
}) {
  const pending = cell.events.filter((e) => e.status === "pending");
  const completed = cell.events.filter((e) => e.status === "completed");
  const preview = [...pending, ...completed].slice(0, 2);

  return (
    <button
      type="button"
      onClick={() => onSelect(cell.date, cell.events)}
      className={cn(
        "flex min-h-28 flex-col rounded-lg border p-2 text-right transition-colors hover:border-primary/50 hover:bg-muted/40",
        cell.inMonth ? "bg-card" : "bg-muted/30 text-muted-foreground",
        cell.isToday && "border-primary ring-1 ring-primary/30",
        cell.events.length > 0 && "cursor-pointer"
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-1">
        <span
          className={cn(
            "text-sm font-semibold",
            cell.isToday && "text-primary"
          )}
        >
          {cell.dayNumber}
        </span>
        {cell.isToday && (
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
            اليوم
          </span>
        )}
      </div>

      {cell.events.length === 0 ? (
        <span className="text-muted-foreground mt-auto text-[10px]">—</span>
      ) : (
        <div className="mt-auto space-y-1">
          {preview.map((event) => (
            <div
              key={`${event.caseId}-${event.label}-${event.status}`}
              className={cn(
                "truncate rounded px-1 py-0.5 text-[10px] leading-tight",
                event.status === "pending"
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
                  : "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
              )}
            >
              {event.label}
            </div>
          ))}
          {cell.events.length > 2 && (
            <span className="text-muted-foreground block text-[10px]">
              +{cell.events.length - 2} أخرى
            </span>
          )}
        </div>
      )}
    </button>
  );
}

export function ScheduleCalendar({
  year,
  month,
  events,
}: ScheduleCalendarProps) {
  const router = useRouter();
  const cells = buildMonthCalendar(year, month, events);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{
    date: string;
    events: ScheduleEvent[];
  } | null>(null);

  function openDay(date: string, dayEvents: ScheduleEvent[]) {
    setSelectedDay({ date, events: dayEvents });
    setDialogOpen(true);
  }

  function navigate(delta: number) {
    const next = shiftMonth(year, month, delta);
    router.push(`/schedule?month=${monthParam(next.year, next.month)}`);
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>{formatMonthYear(year, month)}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => navigate(-1)}
              aria-label="الشهر السابق"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date();
                router.push(
                  `/schedule?month=${monthParam(
                    now.getFullYear(),
                    now.getMonth() + 1
                  )}`
                );
              }}
            >
              الشهر الحالي
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => navigate(1)}
              aria-label="الشهر التالي"
            >
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4 text-sm">
            اضغط على أي يوم لمعرفة المطلوب منك وما تم إنجازه
          </p>

          <div className="mb-2 grid grid-cols-7 gap-2">
            {ARABIC_WEEKDAYS_SHORT.map((day) => (
              <div
                key={day}
                className="text-muted-foreground py-1 text-center text-xs font-medium"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {cells.map((cell) => (
              <DayCell
                key={cell.date}
                cell={cell}
                onSelect={openDay}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <ScheduleDayDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        date={selectedDay?.date ?? null}
        events={selectedDay?.events ?? []}
      />
    </>
  );
}
