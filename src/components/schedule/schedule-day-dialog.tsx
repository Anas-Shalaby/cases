"use client";

import { CheckCircle2, CircleDashed } from "lucide-react";

import { ScheduleEventItem } from "@/components/schedule/schedule-event-item";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ARABIC_WEEKDAYS, type ScheduleEvent } from "@/lib/case-schedule";
import { formatDate } from "@/lib/utils";

interface ScheduleDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string | null;
  events: ScheduleEvent[];
}

function getWeekdayName(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return ARABIC_WEEKDAYS[date.getDay()];
}

function EventSection({
  title,
  icon: Icon,
  events,
  emptyMessage,
}: {
  title: string;
  icon: typeof CircleDashed;
  events: ScheduleEvent[];
  emptyMessage: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 shrink-0" />
        <h3 className="text-sm font-semibold">{title}</h3>
        {events.length > 0 && (
          <span className="text-muted-foreground text-xs">({events.length})</span>
        )}
      </div>

      {events.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-sm">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <ScheduleEventItem
              key={`${event.caseId}-${event.label}-${event.status}`}
              event={event}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function ScheduleDayDialog({
  open,
  onOpenChange,
  date,
  events,
}: ScheduleDayDialogProps) {
  const pending = events.filter((event) => event.status === "pending");
  const completed = events.filter((event) => event.status === "completed");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {date ? `${getWeekdayName(date)} — ${formatDate(date)}` : "تفاصيل اليوم"}
          </DialogTitle>
          <DialogDescription>
            {pending.length > 0
              ? `لديك ${pending.length} مهمة مطلوبة في هذا اليوم`
              : completed.length > 0
                ? "لا توجد مهام معلّقة — يعرض ما تم إنجازه"
                : "لا توجد مواعيد أو مهام في هذا اليوم"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <EventSection
            title="المطلوب منك"
            icon={CircleDashed}
            events={pending}
            emptyMessage="لا يوجد شيء مطلوب في هذا اليوم"
          />

          <EventSection
            title="تم الإنجاز"
            icon={CheckCircle2}
            events={completed}
            emptyMessage="لم يُسجَّل إنجاز في هذا اليوم"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
