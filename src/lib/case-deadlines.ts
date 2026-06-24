import type { Case, CaseWithRelations } from "@/types/database";

/** عدد الأيام المتبقية التي تُعتبر فيها القضية متأخرة/عاجلة */
export const URGENT_DEADLINE_DAYS = 2;

export interface DashboardOverview {
  stats: {
    total: number;
    open: number;
    delayed: number;
    closed: number;
  };
  delayedCases: CaseWithRelations[];
  overdueDeadlines: CaseDeadline[];
  upcomingDeadlines: CaseDeadline[];
  milestoneProgress: {
    totalMilestones: number;
    completedMilestones: number;
    averageCompletion: number;
  };
  teamCount?: number;
}

export type DeadlineType = "meeting" | "initial_report" | "final_report";

export type DeadlineUrgency = "past_due" | "urgent" | "upcoming";

export interface CaseDeadline {
  caseId: string;
  caseNumber: string;
  caseName: string;
  deadlineType: DeadlineType;
  deadlineDate: string;
  daysUntil: number;
  /** تجاوز الموعد */
  isPastDue: boolean;
  /** متأخر أو عاجل (متبقي ≤ URGENT_DEADLINE_DAYS) */
  isLate: boolean;
  urgency: DeadlineUrgency;
}

export const DEADLINE_LABELS: Record<DeadlineType, string> = {
  meeting: "موعد الاجتماع",
  initial_report: "التقرير المبدئي",
  final_report: "التقرير النهائي",
};

const DEADLINE_FIELDS: {
  field: keyof Case;
  type: DeadlineType;
  milestoneField: keyof Case;
}[] = [
  {
    field: "meeting_date",
    type: "meeting",
    milestoneField: "experts_meeting_at",
  },
  {
    field: "initial_report_date",
    type: "initial_report",
    milestoneField: "initial_report_prepared_at",
  },
  {
    field: "final_report_date",
    type: "final_report",
    milestoneField: "final_report_prepared_at",
  },
];

function daysBetween(from: string, to: string): number {
  const fromMs = new Date(from).setHours(0, 0, 0, 0);
  const toMs = new Date(to).setHours(0, 0, 0, 0);
  return Math.round((toMs - fromMs) / (1000 * 60 * 60 * 24));
}

function getDeadlineUrgency(daysUntil: number): DeadlineUrgency {
  if (daysUntil < 0) return "past_due";
  if (daysUntil <= URGENT_DEADLINE_DAYS) return "urgent";
  return "upcoming";
}

export function formatDeadlineUrgency(daysUntil: number): string {
  if (daysUntil < 0) {
    const days = Math.abs(daysUntil);
    return days === 1 ? "متأخر يوم واحد" : `متأخر ${days} أيام`;
  }
  if (daysUntil === 0) return "اليوم";
  if (daysUntil === 1) return "غداً";
  if (daysUntil === 2) return "باقي يومين";
  return `باقي ${daysUntil} أيام`;
}

export function collectCaseDeadlines(
  cases: CaseWithRelations[]
): CaseDeadline[] {
  const today = new Date().toISOString().slice(0, 10);
  const deadlines: CaseDeadline[] = [];

  for (const caseItem of cases) {
    if (caseItem.status === "closed") continue;

    for (const { field, type, milestoneField } of DEADLINE_FIELDS) {
      const date = caseItem[field] as string | null;
      if (!date) continue;

      // لا نُظهر موعداً إذا أُنجزت المرحلة المقابلة له
      if (caseItem[milestoneField]) continue;

      const daysUntil = daysBetween(today, date);
      const isPastDue = daysUntil < 0;
      const isLate = daysUntil <= URGENT_DEADLINE_DAYS;

      deadlines.push({
        caseId: caseItem.id,
        caseNumber: caseItem.case_number,
        caseName: caseItem.case_name,
        deadlineType: type,
        deadlineDate: date,
        daysUntil,
        isPastDue,
        isLate,
        urgency: getDeadlineUrgency(daysUntil),
      });
    }
  }

  return deadlines;
}

export function isCaseLate(caseItem: CaseWithRelations): boolean {
  if (caseItem.status === "closed") return false;
  return collectCaseDeadlines([caseItem]).some((d) => d.isLate);
}

export function getCasesWithLateDeadlines(
  cases: CaseWithRelations[]
): CaseWithRelations[] {
  const activeCases = cases.filter((c) => c.status !== "closed");
  const urgencyByCase = new Map<string, number>();

  for (const deadline of collectCaseDeadlines(activeCases)) {
    if (!deadline.isLate) continue;

    const current = urgencyByCase.get(deadline.caseId);
    if (current === undefined || deadline.daysUntil < current) {
      urgencyByCase.set(deadline.caseId, deadline.daysUntil);
    }
  }

  return activeCases
    .filter((c) => urgencyByCase.has(c.id))
    .sort(
      (a, b) =>
        (urgencyByCase.get(a.id) ?? 0) - (urgencyByCase.get(b.id) ?? 0)
    );
}

export function computeCaseStats(cases: CaseWithRelations[]) {
  const lateCases = getCasesWithLateDeadlines(cases);

  return {
    total: cases.length,
    open: cases.filter((c) => c.status === "open").length,
    delayed: lateCases.length,
    closed: cases.filter((c) => c.status === "closed").length,
  };
}
