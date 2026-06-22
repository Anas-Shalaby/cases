"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireCoordinator } from "@/lib/auth/require-coordinator";
import {
  CASE_MILESTONE_KEYS,
  type CaseMilestoneKey,
} from "@/lib/case-milestones";

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export async function toggleCaseMilestone(
  caseId: string,
  field: CaseMilestoneKey,
  completed: boolean
) {
  const auth = await requireCoordinator();
  if ("error" in auth) return { error: auth.error._form[0] };

  if (!CASE_MILESTONE_KEYS.includes(field)) {
    return { error: "مرحلة غير صالحة" };
  }

  const supabase = await createClient();
  const dateValue = completed ? todayDateString() : null;

  const updatePayload =
    field === "case_closed_at" && completed
      ? { [field]: dateValue, status: "closed" as const }
      : { [field]: dateValue };

  const { error } = await supabase
    .from("cases")
    .update(updatePayload)
    .eq("id", caseId);

  if (error) return { error: error.message };

  revalidatePath("/cases");
  revalidatePath(`/cases/${caseId}`);
  revalidatePath(`/cases/${caseId}/edit`);

  return { success: true as const, date: dateValue };
}
