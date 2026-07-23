"use client";

import { useState } from "react";
import {
  FileText,
  Pencil,
  Plus,
  Trash2,
  Upload,
  ArrowLeftRight,
  Clock,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CASE_STATUS_LABELS } from "@/lib/constants";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import type { ActivityLogWithRelations, LogActionType, CaseStatus } from "@/types/database";

const ACTION_CONFIG: Record<
  LogActionType,
  {
    icon: typeof Plus;
    label: string;
    color: string;
    dotColor: string;
  }
> = {
  create_case: {
    icon: Plus,
    label: "إنشاء قضية",
    color: "text-emerald-600 dark:text-emerald-400",
    dotColor: "bg-emerald-500",
  },
  update_case: {
    icon: Pencil,
    label: "تعديل قضية",
    color: "text-blue-600 dark:text-blue-400",
    dotColor: "bg-blue-500",
  },
  update_case_situation: {
    icon: ArrowLeftRight,
    label: "تعديل موقف القضية",
    color: "text-sky-600 dark:text-sky-400",
    dotColor: "bg-sky-500",
  },
  delete_case: {
    icon: Trash2,
    label: "حذف قضية",
    color: "text-red-600 dark:text-red-400",
    dotColor: "bg-red-500",
  },
  create_user: {
    icon: User,
    label: "إضافة عضو",
    color: "text-violet-600 dark:text-violet-400",
    dotColor: "bg-violet-500",
  },
  update_user: {
    icon: Pencil,
    label: "تعديل عضو",
    color: "text-indigo-600 dark:text-indigo-400",
    dotColor: "bg-indigo-500",
  },
  delete_user: {
    icon: Trash2,
    label: "حذف عضو",
    color: "text-rose-600 dark:text-rose-400",
    dotColor: "bg-rose-500",
  },
  upload_document: {
    icon: Upload,
    label: "رفع مستند",
    color: "text-amber-600 dark:text-amber-400",
    dotColor: "bg-amber-500",
  },
};

function MetadataChanges({ metadata }: { metadata: Record<string, unknown> | null }) {
  if (!metadata) return null;

  const changes: { label: string; from: string; to: string }[] = [];

  if (metadata.old_status && metadata.new_status) {
    const oldLabel =
      CASE_STATUS_LABELS[metadata.old_status as CaseStatus] ??
      (metadata.old_status as string);
    const newLabel =
      CASE_STATUS_LABELS[metadata.new_status as CaseStatus] ??
      (metadata.new_status as string);
    changes.push({ label: "الحالة", from: oldLabel, to: newLabel });
  }

  if (
    metadata.old_situation !== undefined &&
    metadata.new_situation !== undefined
  ) {
    changes.push({
      label: "موقف القضية",
      from: (metadata.old_situation as string) || "—",
      to: (metadata.new_situation as string) || "— (تم المسح)",
    });
  }

  if (changes.length === 0) return null;

  return (
    <div className="mt-2 space-y-1.5">
      {changes.map((change, i) => (
        <div
          key={i}
          className="flex items-start gap-2 rounded-lg border border-dashed px-3 py-2 text-xs"
        >
          <ArrowLeftRight className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <span className="font-medium text-muted-foreground">
              {change.label}:
            </span>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-700 line-through dark:bg-red-950 dark:text-red-300">
                {change.from}
              </span>
              <span className="text-muted-foreground">←</span>
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {change.to}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineEntry({ log }: { log: ActivityLogWithRelations }) {
  const config = ACTION_CONFIG[log.action_type];
  const Icon = config.icon;

  return (
    <div className="group relative flex gap-4 pb-8 last:pb-0">
      {/* Vertical line */}
      <div className="absolute right-[15px] top-8 bottom-0 w-px bg-border group-last:hidden" />

      {/* Dot */}
      <div
        className={cn(
          "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-background shadow-sm",
          config.dotColor
        )}
      >
        <Icon className="size-3.5 text-white" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn("border-transparent text-[11px]", config.color)}
          >
            {config.label}
          </Badge>
          <time
            className="text-muted-foreground text-[11px]"
            dateTime={log.created_at}
            title={formatDate(log.created_at)}
          >
            <Clock className="mb-px ml-1 inline-block size-3" />
            {formatRelativeTime(log.created_at)}
          </time>
        </div>

        <p className="mt-1 text-sm leading-relaxed">{log.description}</p>

        {log.actor && (
          <p className="text-muted-foreground mt-1 text-xs">
            بواسطة: <span className="font-medium text-foreground">{log.actor.full_name}</span>
          </p>
        )}

        <MetadataChanges metadata={log.metadata} />
      </div>
    </div>
  );
}

interface CaseTimelineProps {
  logs: ActivityLogWithRelations[];
}

export function CaseTimeline({ logs }: CaseTimelineProps) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL_COUNT = 5;
  const hasMore = logs.length > INITIAL_COUNT;
  const visibleLogs = showAll ? logs : logs.slice(0, INITIAL_COUNT);

  if (logs.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted">
            <FileText className="size-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold">لا توجد أنشطة مسجّلة</h3>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            ستظهر هنا تفاصيل كل التغييرات التي تتم على هذه القضية
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-5 text-primary" />
          سجل التغييرات
        </CardTitle>
        <CardDescription>
          {logs.length === 1
            ? "نشاط واحد مسجّل على هذه القضية"
            : `${logs.length} أنشطة مسجّلة على هذه القضية`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="pr-1">
          {visibleLogs.map((log) => (
            <TimelineEntry key={log.id} log={log} />
          ))}
        </div>

        {hasMore && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="gap-1.5"
            >
              {showAll ? (
                <>
                  <ChevronUp className="size-4" />
                  عرض أقل
                </>
              ) : (
                <>
                  <ChevronDown className="size-4" />
                  عرض الكل ({logs.length})
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
