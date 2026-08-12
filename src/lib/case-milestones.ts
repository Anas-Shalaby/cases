export const CASE_MILESTONES = [
  { key: "case_received_at", label: "استلام القضية" },
  { key: "parties_invited_at", label: "دعوة الأطراف" },
  { key: "experts_notified_at", label: "إبلاغ لجنة الخبراء بميعاد الاجتماع" },
  {
    key: "summary_memo_uploaded_at",
    label: "رفع مذكرة المختصرة لأعمال الخبرة للمحكمة",
  },
  { key: "experts_meeting_at", label: "اجتماع الخبراء" },
  {
    key: "documents_submission_deadline_at",
    label: "مهلة تقديم المستندات",
  },
  {
    key: "documents_received_at",
    label: "استلام المستندات",
  },
  { key: "initial_report_prepared_at", label: "إعداد التقرير المبدئي" },
  {
    key: "initial_report_feedback_deadline_at",
    label: "مهلة التعقيب علي المبدئي",
  },
  {
    key: "initial_report_feedback_received_at",
    label: "استلام التعقيب المبدئي",
  },
  { key: "final_report_prepared_at", label: "إعداد التقرير النهائي" },
  { key: "case_closed_at", label: "غلق القضية" },
] as const;

export type CaseMilestoneKey = (typeof CASE_MILESTONES)[number]["key"];

export const CASE_MILESTONE_KEYS = CASE_MILESTONES.map((m) => m.key);

/** المراحل التي يجب أن تكون قبل ميعاد الاجتماع */
export const PRE_MEETING_MILESTONES: CaseMilestoneKey[] = [
  "experts_notified_at",
  "summary_memo_uploaded_at",
];
