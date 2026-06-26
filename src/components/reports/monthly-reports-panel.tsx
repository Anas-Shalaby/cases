"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Clock,
  FolderOpen,
} from "lucide-react";

import { ExportCasesButtons } from "@/components/cases/export-cases-buttons";
import { CasesDataTable } from "@/components/cases/cases-data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildPeriodReport,
  defaultPeriodRange,
} from "@/lib/monthly-reports";
import { USER_ROLE_LABELS } from "@/lib/constants";
import type { CaseWithRelations, UserRole } from "@/types/database";

interface TeamMemberOption {
  id: string;
  full_name: string;
}

interface MonthlyReportsPanelProps {
  cases: CaseWithRelations[];
  coordinators: TeamMemberOption[];
  experts: TeamMemberOption[];
  assistants: TeamMemberOption[];
  isCoordinator: boolean;
  currentRole: UserRole;
  currentUserId: string;
  currentUserName: string;
}

function TeamFilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: TeamMemberOption[];
  allLabel: string;
  disabled?: boolean;
}) {
  const selected = options.find((o) => o.id === value);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Select value={value} onValueChange={(v) => onChange(v ?? "all")} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={allLabel}>
            {value === "all" ? allLabel : (selected?.full_name ?? allLabel)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function MonthlyReportsPanel({
  cases,
  coordinators,
  experts,
  assistants,
  isCoordinator,
  currentRole,
  currentUserId,
  currentUserName,
}: MonthlyReportsPanelProps) {
  const initialRange = defaultPeriodRange();
  const [dateFrom, setDateFrom] = useState(initialRange.from);
  const [dateTo, setDateTo] = useState(initialRange.to);
  const [coordinatorId, setCoordinatorId] = useState("all");
  const [expertId, setExpertId] = useState(
    currentRole === "expert" ? currentUserId : "all"
  );
  const [assistantId, setAssistantId] = useState(
    currentRole === "assistant" ? currentUserId : "all"
  );

  const filters = useMemo(
    () => ({
      coordinatorId:
        isCoordinator && coordinatorId !== "all" ? coordinatorId : undefined,
      expertId:
        currentRole === "expert"
          ? currentUserId
          : isCoordinator && expertId !== "all"
            ? expertId
            : undefined,
      assistantId:
        currentRole === "assistant"
          ? currentUserId
          : isCoordinator && assistantId !== "all"
            ? assistantId
            : undefined,
    }),
    [
      isCoordinator,
      coordinatorId,
      expertId,
      assistantId,
      currentRole,
      currentUserId,
    ]
  );

  const report = useMemo(
    () => buildPeriodReport(cases, dateFrom, dateTo, filters),
    [cases, dateFrom, dateTo, filters]
  );

  const invalidRange = dateFrom > dateTo;

  const coordinatorName =
    coordinatorId !== "all"
      ? coordinators.find((m) => m.id === coordinatorId)?.full_name
      : undefined;
  const expertFilterName =
    currentRole === "expert"
      ? currentUserName
      : expertId !== "all"
        ? experts.find((m) => m.id === expertId)?.full_name
        : undefined;
  const assistantFilterName =
    currentRole === "assistant"
      ? currentUserName
      : assistantId !== "all"
        ? assistants.find((m) => m.id === assistantId)?.full_name
        : undefined;

  const exportLabel =
    expertFilterName ?? coordinatorName ?? assistantFilterName;

  const statCards = [
    {
      label: "قضايا الفترة",
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
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">من تاريخ</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">إلى تاريخ</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                dir="ltr"
              />
            </div>

            {isCoordinator && (
              <>
                <TeamFilterSelect
                  label={USER_ROLE_LABELS.coordinator}
                  value={coordinatorId}
                  onChange={setCoordinatorId}
                  options={coordinators}
                  allLabel="كل المنسقين"
                />
                <TeamFilterSelect
                  label={USER_ROLE_LABELS.expert}
                  value={expertId}
                  onChange={setExpertId}
                  options={experts}
                  allLabel="كل الخبراء"
                />
                <TeamFilterSelect
                  label={USER_ROLE_LABELS.assistant}
                  value={assistantId}
                  onChange={setAssistantId}
                  options={assistants}
                  allLabel="كل مساعدي الخبراء"
                />
              </>
            )}

            {currentRole === "expert" && !isCoordinator && (
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">الخبير</label>
                <Input value={currentUserName} disabled readOnly />
              </div>
            )}

            {currentRole === "assistant" && !isCoordinator && (
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">مساعد الخبير</label>
                <Input value={currentUserName} disabled readOnly />
              </div>
            )}
          </div>

          {invalidRange && (
            <p className="text-sm text-destructive">
              تاريخ «من» يجب أن يكون قبل أو يساوي تاريخ «إلى»
            </p>
          )}

          <div className="flex justify-end">
            <ExportCasesButtons
              cases={report.cases}
              expertName={exportLabel}
              periodLabel={report.periodLabel}
              disabled={invalidRange}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-sm">
          {report.periodLabel}
        </Badge>
        {coordinatorName && (
          <Badge variant="secondary" className="text-sm">
            المنسق: {coordinatorName}
          </Badge>
        )}
        {expertFilterName && (
          <Badge variant="secondary" className="text-sm">
            الخبير: {expertFilterName}
          </Badge>
        )}
        {assistantFilterName && (
          <Badge variant="secondary" className="text-sm">
            مساعد الخبير: {assistantFilterName}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
              قضايا التقرير
            </span>
            <span className="text-muted-foreground text-sm font-normal">
              {report.cases.length} قضية
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {invalidRange ? (
            <p className="text-muted-foreground py-16 text-center text-sm">
              صحّح نطاق التاريخ لعرض التقرير
            </p>
          ) : report.cases.length === 0 ? (
            <p className="text-muted-foreground py-16 text-center text-sm">
              لا توجد قضايا في هذه الفترة للمعايير المحددة
            </p>
          ) : (
            <CasesDataTable cases={report.cases} canEdit={isCoordinator} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
