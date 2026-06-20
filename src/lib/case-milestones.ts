export const CASE_MILESTONES = [
  { key: "case_received_at", label: "استلام القضية" },
  { key: "parties_invited_at", label: "دعوة الأطراف" },
  { key: "experts_meeting_at", label: "اجتماع الخبراء" },
  {
    key: "defendant_documents_received_at",
    label: "استلام مستندات المدعي عليه",
  },
  {
    key: "plaintiff_documents_received_at",
    label: "استلام مستندات المدعي",
  },
  { key: "initial_report_prepared_at", label: "إعداد التقرير المبدئي" },
  { key: "final_report_prepared_at", label: "إعداد التقرير النهائي" },
  { key: "case_closed_at", label: "غلق القضية" },
] as const;

export type CaseMilestoneKey = (typeof CASE_MILESTONES)[number]["key"];

export const CASE_MILESTONE_KEYS = CASE_MILESTONES.map((m) => m.key);
