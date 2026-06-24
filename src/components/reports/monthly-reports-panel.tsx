"use client";

import { useMemo, useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  FolderOpen,
  AlertTriangle,
} from "lucide-react";

import { ExportCasesButtons } from "@/components/cases/export-cases-buttons";
import { CasesDataTable } from "@/components/cases/cases-data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AR_MONTHS,
  buildMonthlyReport,
  formatReportPeriod,
} from "@/lib/monthly-reports";
import type { CaseWithRelations, Profile } from "@/types/database";

interface MonthlyReportsPanelProps {
  cases: CaseWithRelations[];
  experts: Pick<Profile, "id" | "full_name">[];
  isCoordinator: boolean;
  currentUserId?: string;
}

export function MonthlyReportsPanel({
  cases,
  experts,
  isCoordinator,
  currentUserId,
}: MonthlyReportsPanelProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [expertId, setExpertId] = useState(
    isCoordinator ? "all" : (currentUserId ?? "all")
  );

  const yearOptions = useMemo(() => {
    const years = new Set<number>([now.getFullYear()]);
    for (const c of cases) {
      years.add(parseInt(c.created_at.slice(0, 4), 10));
      if (c.case_closed_at) {
        years.add(parseInt(c.case_closed_at.slice(0, 4), 10));
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [cases, now]);

  const effectiveExpertId =
    !isCoordinator && currentUserId
      ? currentUserId
      : expertId === "all"
        ? undefined
        : expertId;

  const report = useMemo(
    () => buildMonthlyReport(cases, year, month, effectiveExpertId),
    [cases, year, month, effectiveExpertId]
  );

  const periodLabel = formatReportPeriod(year, month);

  const statCards = [
    {
      label: "قضايا الشهر",
      value: report.cases.length,
      icon: Briefcase,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400",
    },
    {
      label: "قضايا جديدة",
      value: report.stats.newCases,
      icon: FolderOpen,
      color:
        "text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400",
    },
    {
      label: "قضايا مُغلقة",
      value: report.stats.closedCases,
      icon: CheckCircle2,
      color: "text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-400",
    },
    {
      label: "مواعيد متأخرة",
      value: report.stats.lateCases,
      icon: AlertTriangle,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400",
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">السنة</label>
              <Select
                value={String(year)}
                onValueChange={(v) => setYear(Number(v ?? year))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الشهر</label>
              <Select
                value={String(month)}
                onValueChange={(v) => setMonth(Number(v ?? month))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{AR_MONTHS[month - 1]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {AR_MONTHS.map((label, index) => (
                    <SelectItem key={label} value={String(index + 1)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isCoordinator && (
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <label className="text-sm font-medium">الخبير</label>
                <Select value={expertId} onValueChange={(v) => setExpertId(v ?? "all")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="كل الخبراء" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الخبراء</SelectItem>
                    {experts.map((expert) => (
                      <SelectItem key={expert.id} value={expert.id}>
                        {expert.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <ExportCasesButtons
            cases={report.cases}
            expertName={report.expertName}
            periodLabel={periodLabel}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-sm">
          {periodLabel}
        </Badge>
        {report.expertName && (
          <Badge variant="secondary" className="text-sm">
            الخبير: {report.expertName}
          </Badge>
        )}
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <div className={`rounded-lg p-2 ${color}`}>
                <Icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="hidden overflow-hidden lg:block">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Clock className="size-4" />
              قضايا التقرير الشهري
            </span>
            <span className="text-muted-foreground text-sm font-normal">
              {report.cases.length} قضية
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {report.cases.length === 0 ? (
            <p className="text-muted-foreground py-16 text-center text-sm">
              لا توجد قضايا في هذا الشهر للمعايير المحددة
            </p>
          ) : (
            <CasesDataTable cases={report.cases} canEdit={isCoordinator} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
