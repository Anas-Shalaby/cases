import type { CaseWithRelations } from "@/types/database";

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

export interface CaseDeadline {
  caseId: string;
  caseNumber: string;
  caseName: string;
  deadlineType: DeadlineType;
  deadlineDate: string;
  isOverdue: boolean;
  daysUntil: number;
}

export const DEADLINE_LABELS: Record<DeadlineType, string> = {
  meeting: "موعد الاجتماع",
  initial_report: "التقرير المبدئي",
  final_report: "التقرير النهائي",
};

const DEADLINE_FIELDS: {
  field: keyof CaseWithRelations;
  type: DeadlineType;
}[] = [
  { field: "meeting_date", type: "meeting" },
  { field: "initial_report_date", type: "initial_report" },
  { field: "final_report_date", type: "final_report" },
];

function daysBetween(from: string, to: string): number {
  const fromMs = new Date(from).setHours(0, 0, 0, 0);
  const toMs = new Date(to).setHours(0, 0, 0, 0);
  return Math.round((toMs - fromMs) / (1000 * 60 * 60 * 24));
}

export function collectCaseDeadlines(
  cases: CaseWithRelations[]
): CaseDeadline[] {
  const today = new Date().toISOString().slice(0, 10);
  const deadlines: CaseDeadline[] = [];

  for (const caseItem of cases) {
    if (caseItem.status === "closed") continue;

    for (const { field, type } of DEADLINE_FIELDS) {
      const date = caseItem[field] as string | null;
      if (!date) continue;

      const daysUntil = daysBetween(today, date);
      deadlines.push({
        caseId: caseItem.id,
        caseNumber: caseItem.case_number,
        caseName: caseItem.case_name,
        deadlineType: type,
        deadlineDate: date,
        isOverdue: date < today,
        daysUntil,
      });
    }
  }

  return deadlines;
}
