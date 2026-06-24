import { CASE_STATUS_LABELS } from "@/lib/constants";
import { isCaseLate } from "@/lib/case-deadlines";
import type { CaseWithRelations } from "@/types/database";

export const AR_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
] as const;

export interface MonthlyReportStats {
  newCases: number;
  closedCases: number;
  activeCases: number;
  lateCases: number;
  openCases: number;
}

export interface MonthlyReport {
  year: number;
  month: number;
  monthLabel: string;
  expertId?: string;
  expertName?: string;
  stats: MonthlyReportStats;
  cases: CaseWithRelations[];
}

function parseDateOnly(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isInMonth(dateStr: string | null, year: number, month: number): boolean {
  if (!dateStr) return false;
  const d = parseDateOnly(dateStr);
  return d.getFullYear() === year && d.getMonth() + 1 === month;
}

function monthEndDate(year: number, month: number): Date {
  return new Date(year, month, 0);
}

function monthStartDate(year: number, month: number): Date {
  return new Date(year, month - 1, 1);
}

export function isCaseRelevantInMonth(
  caseItem: CaseWithRelations,
  year: number,
  month: number
): boolean {
  const start = monthStartDate(year, month);
  const end = monthEndDate(year, month);

  if (isInMonth(caseItem.created_at, year, month)) return true;
  if (isInMonth(caseItem.assignment_date, year, month)) return true;
  if (isInMonth(caseItem.case_closed_at, year, month)) return true;
  if (isInMonth(caseItem.meeting_date, year, month)) return true;
  if (isInMonth(caseItem.initial_report_date, year, month)) return true;
  if (isInMonth(caseItem.final_report_date, year, month)) return true;

  const created = parseDateOnly(caseItem.created_at);
  const closed = caseItem.case_closed_at
    ? parseDateOnly(caseItem.case_closed_at)
    : null;

  if (created <= end && (!closed || closed >= start)) {
    return true;
  }

  return false;
}

export function buildMonthlyReport(
  cases: CaseWithRelations[],
  year: number,
  month: number,
  expertId?: string
): MonthlyReport {
  const scoped = expertId
    ? cases.filter((c) => c.expert_id === expertId)
    : cases;

  const relevant = scoped.filter((c) =>
    isCaseRelevantInMonth(c, year, month)
  );

  const stats: MonthlyReportStats = {
    newCases: relevant.filter((c) => isInMonth(c.created_at, year, month))
      .length,
    closedCases: relevant.filter((c) =>
      isInMonth(c.case_closed_at, year, month)
    ).length,
    activeCases: relevant.filter((c) => c.status !== "closed").length,
    lateCases: relevant.filter((c) => isCaseLate(c)).length,
    openCases: relevant.filter((c) => c.status === "open").length,
  };

  const expertName = expertId
    ? scoped.find((c) => c.expert_id === expertId)?.expert?.full_name
    : undefined;

  return {
    year,
    month,
    monthLabel: AR_MONTHS[month - 1],
    expertId,
    expertName,
    stats,
    cases: relevant.sort(
      (a, b) =>
        parseDateOnly(b.created_at).getTime() -
        parseDateOnly(a.created_at).getTime()
    ),
  };
}

export function formatReportPeriod(year: number, month: number): string {
  return `${AR_MONTHS[month - 1]} ${year}`;
}
