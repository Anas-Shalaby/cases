import { CASE_STATUS_LABELS } from "@/lib/constants";
import { isCaseLate } from "@/lib/case-deadlines";
import { parseDateOnly } from "@/lib/case-date-rules";
import { formatDate } from "@/lib/utils";
import type { CaseWithRelations } from "@/types/database";

export interface PeriodReportFilters {
  coordinatorId?: string;
  expertId?: string;
  assistantId?: string;
}

export interface PeriodReportStats {
  newCases: number;
  closedCases: number;
  activeCases: number;
  lateCases: number;
  openCases: number;
}

export interface PeriodReport {
  dateFrom: string;
  dateTo: string;
  periodLabel: string;
  filters: PeriodReportFilters;
  coordinatorName?: string;
  expertName?: string;
  assistantName?: string;
  stats: PeriodReportStats;
  cases: CaseWithRelations[];
}

function isInRange(
  dateStr: string | null,
  from: string,
  to: string
): boolean {
  if (!dateStr) return false;
  const time = parseDateOnly(dateStr.slice(0, 10));
  return time >= parseDateOnly(from) && time <= parseDateOnly(to);
}

export function isCaseRelevantInPeriod(
  caseItem: CaseWithRelations,
  dateFrom: string,
  dateTo: string
): boolean {
  const fromTime = parseDateOnly(dateFrom);
  const toTime = parseDateOnly(dateTo);

  const dateFields: (string | null)[] = [
    caseItem.created_at,
    caseItem.assignment_date,
    caseItem.meeting_date,
    caseItem.initial_report_date,
    caseItem.final_report_date,
    caseItem.case_closed_at,
    caseItem.case_received_at,
    caseItem.parties_invited_at,
    caseItem.experts_meeting_at,
    caseItem.defendant_documents_received_at,
    caseItem.plaintiff_documents_received_at,
    caseItem.initial_report_prepared_at,
    caseItem.final_report_prepared_at,
  ];

  if (dateFields.some((d) => d && isInRange(d, dateFrom, dateTo))) {
    return true;
  }

  const created = parseDateOnly(caseItem.created_at.slice(0, 10));
  const closed = caseItem.case_closed_at
    ? parseDateOnly(caseItem.case_closed_at.slice(0, 10))
    : null;

  return created <= toTime && (!closed || closed >= fromTime);
}

function applyTeamFilters(
  cases: CaseWithRelations[],
  filters: PeriodReportFilters
): CaseWithRelations[] {
  return cases.filter((c) => {
    if (filters.coordinatorId && c.coordinator_id !== filters.coordinatorId) {
      return false;
    }
    if (filters.expertId && c.expert_id !== filters.expertId) {
      return false;
    }
    if (filters.assistantId && c.assistant_id !== filters.assistantId) {
      return false;
    }
    return true;
  });
}

function resolveName(
  cases: CaseWithRelations[],
  id: string | undefined,
  role: "coordinator" | "expert" | "assistant"
): string | undefined {
  if (!id) return undefined;
  const match = cases.find((c) => {
    if (role === "coordinator") return c.coordinator_id === id;
    if (role === "expert") return c.expert_id === id;
    return c.assistant_id === id;
  });
  if (role === "coordinator") return match?.coordinator?.full_name;
  if (role === "expert") return match?.expert?.full_name;
  return match?.assistant?.full_name;
}

export function buildPeriodReport(
  cases: CaseWithRelations[],
  dateFrom: string,
  dateTo: string,
  filters: PeriodReportFilters = {}
): PeriodReport {
  if (parseDateOnly(dateFrom) > parseDateOnly(dateTo)) {
    return {
      dateFrom,
      dateTo,
      periodLabel: `${formatDate(dateFrom)} — ${formatDate(dateTo)}`,
      filters,
      stats: {
        newCases: 0,
        closedCases: 0,
        activeCases: 0,
        lateCases: 0,
        openCases: 0,
      },
      cases: [],
    };
  }

  const scoped = applyTeamFilters(cases, filters);
  const relevant = scoped.filter((c) =>
    isCaseRelevantInPeriod(c, dateFrom, dateTo)
  );

  const stats: PeriodReportStats = {
    newCases: relevant.filter((c) => isInRange(c.created_at, dateFrom, dateTo))
      .length,
    closedCases: relevant.filter((c) =>
      isInRange(c.case_closed_at, dateFrom, dateTo)
    ).length,
    activeCases: relevant.filter((c) => c.status !== "closed").length,
    lateCases: relevant.filter((c) => isCaseLate(c)).length,
    openCases: relevant.filter((c) => c.status === "open").length,
  };

  return {
    dateFrom,
    dateTo,
    periodLabel: `${formatDate(dateFrom)} — ${formatDate(dateTo)}`,
    filters,
    coordinatorName: resolveName(cases, filters.coordinatorId, "coordinator"),
    expertName: resolveName(cases, filters.expertId, "expert"),
    assistantName: resolveName(cases, filters.assistantId, "assistant"),
    stats,
    cases: relevant.sort(
      (a, b) =>
        parseDateOnly(b.created_at.slice(0, 10)) -
        parseDateOnly(a.created_at.slice(0, 10))
    ),
  };
}

export function defaultPeriodRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = now;
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export { CASE_STATUS_LABELS };
