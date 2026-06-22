"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LOG_ACTION_COLORS,
  LOG_ACTION_FILTERS,
  LOG_ACTION_LABELS,
} from "@/lib/activity-logs";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import type { ActivityLogWithRelations, LogActionType } from "@/types/database";

type ActionFilter = "all" | LogActionType;

interface ActivityLogsListProps {
  logs: ActivityLogWithRelations[];
}

export function ActivityLogsList({ logs }: ActivityLogsListProps) {
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");

  const filtered = useMemo(() => {
    if (actionFilter === "all") return logs;
    return logs.filter((log) => log.action_type === actionFilter);
  }, [logs, actionFilter]);

  const counts = useMemo(() => {
    const byType = (type: LogActionType) =>
      logs.filter((l) => l.action_type === type).length;
    return {
      all: logs.length,
      create_case: byType("create_case"),
      update_case: byType("update_case"),
      delete_case: byType("delete_case"),
      create_user: byType("create_user"),
      upload_document: byType("upload_document"),
    };
  }, [logs]);

  if (logs.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted">
            <ClipboardList className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">لا توجد أنشطة مسجّلة بعد</h3>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            ستظهر هنا إجراءات المنسقين: إنشاء القضايا، التعديل، إضافة الأعضاء،
            ورفع المستندات
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          إجمالي السجلات:{" "}
          <span className="text-foreground font-semibold">{logs.length}</span>
        </p>
        <Select
          value={actionFilter}
          onValueChange={(v) => setActionFilter((v ?? "all") as ActionFilter)}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="تصفية حسب النوع">
              {
                LOG_ACTION_FILTERS.find((f) => f.value === actionFilter)
                  ?.label
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LOG_ACTION_FILTERS.map((filter) => (
              <SelectItem key={filter.value} value={filter.value}>
                {filter.label} ({counts[filter.value]})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="hidden overflow-hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>التاريخ</TableHead>
              <TableHead>المنسق</TableHead>
              <TableHead>نوع النشاط</TableHead>
              <TableHead>الوصف</TableHead>
              <TableHead>القضية</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-10 text-center"
                >
                  لا توجد نتائج لهذا التصفية
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((log) => <LogRow key={log.id} log={log} />)
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="space-y-3 lg:hidden">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-10 text-center text-sm">
              لا توجد نتائج لهذا التصفية
            </CardContent>
          </Card>
        ) : (
          filtered.map((log) => (
            <Card key={log.id}>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <ActionBadge type={log.action_type} />
                  <time
                    className="text-muted-foreground shrink-0 text-xs"
                    dateTime={log.created_at}
                    title={formatDate(log.created_at)}
                  >
                    {formatRelativeTime(log.created_at)}
                  </time>
                </div>
                <p className="text-sm leading-relaxed">{log.description}</p>
                <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span>
                    المنسق:{" "}
                    <span className="text-foreground font-medium">
                      {log.actor?.full_name ?? "—"}
                    </span>
                  </span>
                  {log.case && (
                    <Link
                      href={`/cases/${log.case.id}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {log.case.case_number}
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function LogRow({ log }: { log: ActivityLogWithRelations }) {
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">
        <div className="text-sm">{formatDate(log.created_at)}</div>
        <div className="text-muted-foreground text-xs">
          {formatRelativeTime(log.created_at)}
        </div>
      </TableCell>
      <TableCell className="font-medium">
        {log.actor?.full_name ?? "—"}
      </TableCell>
      <TableCell>
        <ActionBadge type={log.action_type} />
      </TableCell>
      <TableCell className="max-w-md text-sm leading-relaxed">
        {log.description}
      </TableCell>
      <TableCell>
        {log.case ? (
          <Link
            href={`/cases/${log.case.id}`}
            className="text-primary text-sm font-medium hover:underline"
            dir="ltr"
          >
            {log.case.case_number}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}

function ActionBadge({ type }: { type: LogActionType }) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent", LOG_ACTION_COLORS[type])}
    >
      {LOG_ACTION_LABELS[type]}
    </Badge>
  );
}
