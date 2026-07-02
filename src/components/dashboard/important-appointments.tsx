import { Calendar } from "lucide-react";

import { ScheduleEventItem } from "@/components/schedule/schedule-event-item";
import { NavButton } from "@/components/ui/nav-button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  groupEventsByWeek,
  type ScheduleEvent,
  type WeekDaySchedule,
} from "@/lib/case-schedule";
import { cn, formatDate } from "@/lib/utils";

interface ImportantAppointmentsProps {
  events: ScheduleEvent[];
}

function WeekDayColumn({ day }: { day: WeekDaySchedule }) {
  const pendingCount = day.events.filter((e) => e.status === "pending").length;

  return (
    <div
      className={cn(
        "flex min-w-[9.5rem] flex-1 flex-col rounded-xl border p-3 transition-colors sm:min-w-0",
        day.isToday
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-card"
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p
            className={cn(
              "text-sm font-semibold",
              day.isToday && "text-primary"
            )}
          >
            {day.weekdayName}
          </p>
          <p className="text-muted-foreground text-xs">
            {formatDate(day.date)}
          </p>
        </div>
        {day.isToday && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
            اليوم
          </span>
        )}
      </div>

      {day.events.length === 0 ? (
        <p className="text-muted-foreground flex-1 py-4 text-center text-xs">
          لا مواعيد
        </p>
      ) : (
        <ul className="space-y-2">
          {day.events.map((event) => (
            <li key={`${event.caseId}-${event.label}-${event.status}`}>
              <ScheduleEventItem event={event} compact />
            </li>
          ))}
        </ul>
      )}

      {pendingCount > 0 && (
        <p className="text-muted-foreground mt-3 text-[11px]">
          {pendingCount === 1
            ? "مهمة واحدة مطلوبة"
            : `${pendingCount} مهام مطلوبة`}
        </p>
      )}
    </div>
  );
}

export function ImportantAppointments({ events }: ImportantAppointmentsProps) {
  const week = groupEventsByWeek(events);
  const weekPending = events.filter(
    (event) =>
      event.status === "pending" &&
      week.some((day) => day.date === event.date)
  ).length;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="size-5 text-primary" />
          مواعيد هامة
        </CardTitle>
        <CardAction>
          <NavButton variant="outline" size="sm" href="/schedule">
            الاطلاع على التفاصيل
          </NavButton>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          {weekPending > 0
            ? `لديك ${weekPending} موعداً أو مهمة خلال هذا الأسبوع`
            : "لا توجد مهام معلّقة هذا الأسبوع — راجع التقويم للمواعيد القادمة والمنجزة"}
        </p>

        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 lg:grid lg:grid-cols-7 lg:overflow-visible">
          {week.map((day) => (
            <WeekDayColumn key={day.date} day={day} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
