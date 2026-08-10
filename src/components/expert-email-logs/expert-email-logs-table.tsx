"use client";

import { useMemo, useState } from "react";
import { Mail } from "lucide-react";

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
import { DeleteEmailLogDialog } from "@/components/expert-email-logs/delete-email-log-dialog";
import { ExpertEmailLogDialog } from "@/components/expert-email-logs/expert-email-log-dialog";
import { formatDate } from "@/lib/utils";
import type {
  ExpertEmailLogWithExpert,
  Profile,
} from "@/types/database";

interface ExpertEmailLogsTableProps {
  logs: ExpertEmailLogWithExpert[];
  experts: Pick<Profile, "id" | "full_name">[];
}

function formatTimeDisplay(time: string): string {
  // time is in HH:MM or HH:MM:SS format
  const parts = time.split(":");
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  const period = h >= 12 ? "م" : "ص";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m} ${period}`;
}

export function ExpertEmailLogsTable({
  logs,
  experts,
}: ExpertEmailLogsTableProps) {
  const [expertFilter, setExpertFilter] = useState("all");

  const filtered = useMemo(() => {
    if (expertFilter === "all") return logs;
    return logs.filter((log) => log.expert_id === expertFilter);
  }, [logs, expertFilter]);

  const expertCounts = useMemo(() => {
    const counts: Record<string, number> = { all: logs.length };
    for (const log of logs) {
      counts[log.expert_id] = (counts[log.expert_id] ?? 0) + 1;
    }
    return counts;
  }, [logs]);

  if (logs.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted">
            <Mail className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">
            لا توجد سجلات بريد إلكتروني بعد
          </h3>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            ستظهر هنا سجلات البريد الإلكتروني الواردة من الخبراء والردود عليها
          </p>
          <div className="mt-6">
            <ExpertEmailLogDialog experts={experts} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <p className="text-muted-foreground text-sm">
            إجمالي السجلات:{" "}
            <span className="text-foreground font-semibold">
              {logs.length}
            </span>
          </p>
          {expertFilter !== "all" && (
            <Badge variant="outline" className="text-xs">
              {filtered.length} سجل للخبير المحدد
            </Badge>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={expertFilter}
            onValueChange={(v) => setExpertFilter(v ?? "all")}
          >
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="تصفية حسب الخبير">
                {expertFilter === "all"
                  ? "جميع الخبراء"
                  : experts.find((e) => e.id === expertFilter)?.full_name ??
                    "خبير"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                جميع الخبراء ({expertCounts.all})
              </SelectItem>
              {experts.map((expert) => (
                <SelectItem key={expert.id} value={expert.id}>
                  {expert.full_name} ({expertCounts[expert.id] ?? 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ExpertEmailLogDialog experts={experts} />
        </div>
      </div>

      {/* Desktop Table */}
      <Card className="hidden overflow-hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>اليوم</TableHead>
              <TableHead>الساعة</TableHead>
              <TableHead>آخر بريد إلكتروني</TableHead>
              <TableHead>المرسل (الخبير)</TableHead>
              <TableHead>ما قد تم بالفعل لليوم</TableHead>
              <TableHead className="text-center">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-10 text-center"
                >
                  لا توجد نتائج لهذا التصفية
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((log) => (
                <LogRow key={log.id} log={log} experts={experts} />
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Cards */}
      <div className="space-y-3 lg:hidden">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-10 text-center text-sm">
              لا توجد نتائج لهذا التصفية
            </CardContent>
          </Card>
        ) : (
          filtered.map((log) => (
            <MobileLogCard key={log.id} log={log} experts={experts} />
          ))
        )}
      </div>
    </div>
  );
}

function LogRow({
  log,
  experts,
}: {
  log: ExpertEmailLogWithExpert;
  experts: Pick<Profile, "id" | "full_name">[];
}) {
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">
        {formatDate(log.log_date)}
      </TableCell>
      <TableCell className="whitespace-nowrap font-mono text-xs" dir="ltr">
        {formatTimeDisplay(log.log_time)}
      </TableCell>
      <TableCell className="max-w-xs">
        <p className="line-clamp-2 text-sm leading-relaxed">
          {log.last_email_subject}
        </p>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="whitespace-nowrap">
          {log.expert?.full_name ?? "—"}
        </Badge>
      </TableCell>
      <TableCell className="max-w-xs">
        <ActionItemsList text={log.action_taken} />
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-center gap-1">
          <ExpertEmailLogDialog experts={experts} log={log} />
          <DeleteEmailLogDialog
            logId={log.id}
            expertName={log.expert?.full_name ?? "—"}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

function MobileLogCard({
  log,
  experts,
}: {
  log: ExpertEmailLogWithExpert;
  experts: Pick<Profile, "id" | "full_name">[];
}) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <Badge variant="outline">{log.expert?.full_name ?? "—"}</Badge>
          <div className="flex items-center gap-1">
            <ExpertEmailLogDialog experts={experts} log={log} />
            <DeleteEmailLogDialog
              logId={log.id}
              expertName={log.expert?.full_name ?? "—"}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              آخر بريد إلكتروني
            </p>
            <p className="text-sm leading-relaxed">{log.last_email_subject}</p>
          </div>
          {log.action_taken && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                ما قد تم بالفعل لليوم
              </p>
              <ActionItemsList text={log.action_taken} />
            </div>
          )}
        </div>

        <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span>
            التاريخ:{" "}
            <span className="text-foreground font-medium">
              {formatDate(log.log_date)}
            </span>
          </span>
          <span dir="ltr">
            <span className="text-foreground font-medium">
              {formatTimeDisplay(log.log_time)}
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionItemsList({ text }: { text: string }) {
  if (!text) return <span className="text-muted-foreground">—</span>;

  const items = text
    .split("\n")
    .map((s) => s.replace(/^\s*[-•●]\s*/, "").trim())
    .filter(Boolean);

  if (items.length === 0)
    return <span className="text-muted-foreground">—</span>;

  if (items.length === 1) {
    return (
      <p className="text-sm leading-relaxed text-muted-foreground">
        {items[0]}
      </p>
    );
  }

  return (
    <ul className="list-inside space-y-0.5 text-sm leading-relaxed text-muted-foreground">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-baseline gap-1.5">
          <span className="text-xs text-muted-foreground/60 shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
