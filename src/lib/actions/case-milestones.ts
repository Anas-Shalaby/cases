"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireCoordinator } from "@/lib/auth/require-coordinator";
import { logActivity } from "@/lib/actions/activity-logs";
import {
  buildMilestoneStateAfterUpdate,
  validateMilestoneDate,
} from "@/lib/case-date-rules";
import {
  CASE_MILESTONE_KEYS,
  type CaseMilestoneKey,
} from "@/lib/case-milestones";
import { CASE_STATUS_LABELS } from "@/lib/constants";
import type { Case, CaseStatus } from "@/types/database";

const CASE_DATE_FIELDS =
  "case_number, case_name, status, assignment_date, meeting_date, initial_report_date, final_report_date, case_received_at, parties_invited_at, experts_meeting_at, defendant_documents_received_at, plaintiff_documents_received_at, initial_report_prepared_at, final_report_prepared_at, case_closed_at";

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function isValidDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export async function toggleCaseMilestone(
  caseId: string,
  field: CaseMilestoneKey,
  completed: boolean,
  customDate?: string | null
) {
  const auth = await requireCoordinator();
  if ("error" in auth) return { error: auth.error._form[0] };

  if (!CASE_MILESTONE_KEYS.includes(field)) {
    return { error: "مرحلة غير صالحة" };
  }

  let dateValue: string | null = null;

  if (completed) {
    if (customDate) {
      if (!isValidDateString(customDate)) {
        return { error: "تاريخ غير صالح" };
      }
      dateValue = customDate;
    } else {
      dateValue = todayDateString();
    }
  }

  const supabase = await createClient();

  const { data: existingCase, error: fetchError } = await supabase
    .from("cases")
    .select(CASE_DATE_FIELDS)
    .eq("id", caseId)
    .single();

  if (fetchError || !existingCase) {
    return { error: "القضية غير موجودة" };
  }

  const caseData = existingCase as Case;

  if (dateValue) {
    const nextState = buildMilestoneStateAfterUpdate(caseData, field, dateValue);
    const validationError = validateMilestoneDate(nextState, field, dateValue);
    if (validationError) {
      return { error: validationError };
    }
  }

  const statusChange: CaseStatus | undefined =
    field === "case_closed_at"
      ? completed
        ? "closed"
        : "open"
      : undefined;

  const updatePayload =
    field === "case_closed_at" && completed
      ? { [field]: dateValue, status: "closed" as const }
      : field === "case_closed_at" && !completed
        ? { [field]: null, status: "open" as const }
        : { [field]: dateValue };

  const { error } = await supabase
    .from("cases")
    .update(updatePayload)
    .eq("id", caseId);

  if (error) return { error: error.message };

  if (
    statusChange &&
    existingCase.status !== statusChange
  ) {
    await logActivity({
      userId: auth.profile.id,
      actionType: "update_case",
      caseId,
      description: `عدّل القضية ${existingCase.case_number}: غيّر الحالة من «${CASE_STATUS_LABELS[existingCase.status as CaseStatus]}» إلى «${CASE_STATUS_LABELS[statusChange]}» (عبر مرحلة غلق القضية)`,
      metadata: {
        case_number: existingCase.case_number,
        case_name: existingCase.case_name,
        old_status: existingCase.status,
        new_status: statusChange,
        via_milestone: field,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/cases");
  revalidatePath(`/cases/${caseId}`);
  revalidatePath(`/cases/${caseId}/edit`);
  revalidatePath("/activity-logs");
  revalidatePath("/reports");

  return {
    success: true as const,
    date: dateValue,
    status: statusChange,
  };
}

export async function updateCaseMilestoneDate(
  caseId: string,
  field: CaseMilestoneKey,
  date: string
) {
  const auth = await requireCoordinator();
  if ("error" in auth) return { error: auth.error._form[0] };

  if (!CASE_MILESTONE_KEYS.includes(field)) {
    return { error: "مرحلة غير صالحة" };
  }

  if (!isValidDateString(date)) {
    return { error: "تاريخ غير صالح" };
  }

  const supabase = await createClient();

  const { data: existingCase, error: fetchError } = await supabase
    .from("cases")
    .select(CASE_DATE_FIELDS)
    .eq("id", caseId)
    .single();

  if (fetchError || !existingCase) {
    return { error: "القضية غير موجودة" };
  }

  const caseData = existingCase as Case;

  if (!caseData[field]) {
    return { error: "لا يمكن تعديل تاريخ مرحلة غير مكتملة" };
  }

  const nextState = buildMilestoneStateAfterUpdate(caseData, field, date);
  const validationError = validateMilestoneDate(nextState, field, date);
  if (validationError) {
    return { error: validationError };
  }

  const updatePayload =
    field === "case_closed_at"
      ? { [field]: date, status: "closed" as const }
      : { [field]: date };

  const { error } = await supabase
    .from("cases")
    .update(updatePayload)
    .eq("id", caseId);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/cases");
  revalidatePath(`/cases/${caseId}`);
  revalidatePath(`/cases/${caseId}/edit`);
  revalidatePath("/reports");

  return { success: true as const, date };
}
