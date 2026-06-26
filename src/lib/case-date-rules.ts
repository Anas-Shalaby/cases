import { CASE_MILESTONES, type CaseMilestoneKey } from "@/lib/case-milestones";
import type { Case } from "@/types/database";

export const CASE_SCHEDULE_FIELDS = [
  { key: "assignment_date", label: "تاريخ التكليف" },
  { key: "meeting_date", label: "تاريخ الاجتماع" },
  { key: "initial_report_date", label: "تاريخ التقرير الأولي" },
  { key: "final_report_date", label: "تاريخ التقرير النهائي" },
] as const;

export type CaseScheduleField =
  (typeof CASE_SCHEDULE_FIELDS)[number]["key"];

type DateRecord = Record<string, string | null | undefined>;

export function parseDateOnly(value: string): number {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

function normalizeDate(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function validateScheduleDates(
  dates: DateRecord
): { message: string; field?: CaseScheduleField } | null {
  for (let i = 0; i < CASE_SCHEDULE_FIELDS.length - 1; i++) {
    const earlier = CASE_SCHEDULE_FIELDS[i];
    const later = CASE_SCHEDULE_FIELDS[i + 1];
    const earlierValue = normalizeDate(dates[earlier.key]);
    const laterValue = normalizeDate(dates[later.key]);

    if (earlierValue && laterValue && parseDateOnly(earlierValue) > parseDateOnly(laterValue)) {
      return {
        field: later.key,
        message: `لا يمكن أن يكون «${later.label}» قبل «${earlier.label}»`,
      };
    }
  }

  return null;
}

function milestoneLabel(key: CaseMilestoneKey): string {
  return CASE_MILESTONES.find((m) => m.key === key)?.label ?? key;
}

export function validateMilestoneDate(
  caseData: Pick<Case, CaseMilestoneKey | CaseScheduleField>,
  field: CaseMilestoneKey,
  date: string | null
): string | null {
  if (!date) return null;

  const fieldIndex = CASE_MILESTONES.findIndex((m) => m.key === field);
  if (fieldIndex === -1) return "مرحلة غير صالحة";

  const newTime = parseDateOnly(date);
  const label = milestoneLabel(field);

  for (let i = 0; i < fieldIndex; i++) {
    const prevKey = CASE_MILESTONES[i].key;
    const prevDate = caseData[prevKey];
    if (prevDate && parseDateOnly(prevDate) > newTime) {
      return `لا يمكن أن يكون تاريخ «${label}» قبل «${milestoneLabel(prevKey)}»`;
    }
  }

  for (let i = fieldIndex + 1; i < CASE_MILESTONES.length; i++) {
    const nextKey = CASE_MILESTONES[i].key;
    const nextDate = caseData[nextKey];
    if (nextDate && parseDateOnly(nextDate) < newTime) {
      return `لا يمكن أن يكون تاريخ «${label}» بعد «${milestoneLabel(nextKey)}»`;
    }
  }

  const scheduleError = validateMilestoneAgainstSchedule(caseData, field, date);
  if (scheduleError) return scheduleError;

  return null;
}

function validateMilestoneAgainstSchedule(
  caseData: Pick<Case, CaseScheduleField | CaseMilestoneKey>,
  field: CaseMilestoneKey,
  date: string
): string | null {
  const pairs: { milestone: CaseMilestoneKey; schedule: CaseScheduleField; scheduleLabel: string }[] = [
    { milestone: "experts_meeting_at", schedule: "meeting_date", scheduleLabel: "تاريخ الاجتماع" },
    {
      milestone: "initial_report_prepared_at",
      schedule: "initial_report_date",
      scheduleLabel: "تاريخ التقرير الأولي",
    },
    {
      milestone: "final_report_prepared_at",
      schedule: "final_report_date",
      scheduleLabel: "تاريخ التقرير النهائي",
    },
  ];

  const milestoneTime = parseDateOnly(date);
  const label = milestoneLabel(field);

  for (const pair of pairs) {
    const scheduleValue = normalizeDate(caseData[pair.schedule]);
    if (!scheduleValue) continue;

    const scheduleTime = parseDateOnly(scheduleValue);

    if (pair.milestone === field && milestoneTime > scheduleTime) {
      return `تاريخ «${label}» لا يمكن أن يتجاوز «${pair.scheduleLabel}»`;
    }
  }

  if (field === "final_report_prepared_at") {
    const initialMilestone = caseData.initial_report_prepared_at;
    if (initialMilestone && parseDateOnly(initialMilestone) > milestoneTime) {
      return "لا يمكن إعداد التقرير النهائي بتاريخ قبل التقرير المبدئي";
    }
  }

  return null;
}

export function validateCaseDates(
  caseData: DateRecord & Pick<Case, CaseMilestoneKey>
): string | null {
  const scheduleError = validateScheduleDates(caseData);
  if (scheduleError) return scheduleError.message;

  for (const { key } of CASE_MILESTONES) {
    const value = normalizeDate(caseData[key]);
    if (!value) continue;
    const milestoneError = validateMilestoneDate(
      caseData as Pick<Case, CaseMilestoneKey | CaseScheduleField>,
      key,
      value
    );
    if (milestoneError) return milestoneError;
  }

  return null;
}

export function buildMilestoneStateAfterUpdate(
  caseData: Pick<Case, CaseMilestoneKey | CaseScheduleField>,
  field: CaseMilestoneKey,
  date: string | null
): Pick<Case, CaseMilestoneKey | CaseScheduleField> {
  return { ...caseData, [field]: date };
}
