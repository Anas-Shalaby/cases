import {
  AlertTriangle,
  CalendarClock,
  Clock,
  Users,
} from "lucide-react";

import { CasesTable } from "@/components/cases/cases-table";
import { Badge } from "@/components/ui/badge";
import { NavButton, NavLink } from "@/components/ui/nav-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEADLINE_LABELS, formatDeadlineUrgency, type DashboardOverview } from "@/lib/case-deadlines";
import { formatDate } from "@/lib/utils";

interface DashboardInsightsProps {
  overview: DashboardOverview;
  isCoordinator: boolean;
  canEdit: boolean;
}

export function DashboardInsights({
  overview,
  isCoordinator,
  canEdit,
}: DashboardInsightsProps) {
  const { stats, delayedCases, overdueDeadlines, upcomingDeadlines, milestoneProgress, teamCount } =
    overview;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              تقدّم المراحل (القضايا النشطة)
            </CardTitle>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Clock className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {milestoneProgress.averageCompletion}%
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {milestoneProgress.completedMilestones} مرحلة مكتملة من{" "}
              {milestoneProgress.totalMilestones}
            </p>
          </CardContent>
        </Card>

        {isCoordinator && teamCount !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                أعضاء الفريق
              </CardTitle>
              <div className="rounded-lg bg-violet-50 p-2 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                <Users className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{teamCount}</div>
              <NavButton
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                href="/users"
              >
                إدارة الفريق
              </NavButton>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* القضايا المتأخرة */}
        <Card className="border-amber-200 dark:border-amber-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-amber-600" />
              قضايا بمواعيد متأخرة
              {stats.delayed > 0 && (
                <Badge className="bg-amber-600 text-white">
                  {stats.delayed}
                </Badge>
              )}
            </CardTitle>
            <NavButton variant="outline" size="sm" href="/cases?status=delayed">
              عرض الكل
            </NavButton>
          </CardHeader>
          <CardContent className="pt-0">
            {delayedCases.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                لا توجد قضايا بمواعيد متجاوزة أو عاجلة (خلال يومين)
              </p>
            ) : (
              <CasesTable
                cases={delayedCases}
                canEdit={canEdit}
              />
            )}
          </CardContent>
        </Card>

        {/* المواعيد المتجاوزة */}
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4 text-red-600" />
              مواعيد متأخرة وعاجلة
              {overdueDeadlines.length > 0 && (
                <Badge variant="destructive">{overdueDeadlines.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {overdueDeadlines.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                لا توجد مواعيد متجاوزة أو خلال يومين للقضايا النشطة
              </p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {overdueDeadlines.map((d) => (
                  <li
                    key={`${d.caseId}-${d.deadlineType}`}
                    className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <NavLink
                        href={`/cases/${d.caseId}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {d.caseName}
                      </NavLink>
                      <p className="text-muted-foreground text-xs" dir="ltr">
                        {d.caseNumber}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                      <Badge
                        variant={d.isPastDue ? "destructive" : "outline"}
                        className={
                          d.isPastDue
                            ? "text-xs"
                            : "border-amber-300 bg-amber-50 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
                        }
                      >
                        {DEADLINE_LABELS[d.deadlineType]}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {formatDate(d.deadlineDate)} — {formatDeadlineUrgency(d.daysUntil)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* المواعيد القادمة */}
      {upcomingDeadlines.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-900">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4 text-blue-600" />
              مواعيد خلال 3–7 أيام
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="divide-y rounded-lg border">
              {upcomingDeadlines.map((d) => (
                <li
                  key={`${d.caseId}-${d.deadlineType}`}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <NavLink
                      href={`/cases/${d.caseId}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {d.caseName}
                    </NavLink>
                    <p className="text-muted-foreground text-xs" dir="ltr">
                      {d.caseNumber}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                    <Badge variant="outline" className="text-xs">
                      {DEADLINE_LABELS[d.deadlineType]}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(d.deadlineDate)} — {formatDeadlineUrgency(d.daysUntil)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
