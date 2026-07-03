"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/actions/activity-logs";
import { requireCoordinator } from "@/lib/auth/require-coordinator";
import { createClient } from "@/lib/supabase/server";
import {
  caseSituationSchema,
  emptySituation,
} from "@/lib/validations/case-situation";

export async function updateCaseSituation(caseId: string, situation: string) {
  const auth = await requireCoordinator();
  if ("error" in auth) return { error: auth.error };

  const parsed = caseSituationSchema.safeParse({ situation });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { data: caseItem, error: fetchError } = await supabase
    .from("cases")
    .select("id, case_number, case_name, situation")
    .eq("id", caseId)
    .single();

  if (fetchError || !caseItem) {
    return { error: { _form: ["القضية غير موجودة"] } };
  }

  const normalizedSituation = emptySituation(parsed.data.situation);
  const previousSituation = caseItem.situation?.trim() || null;

  if (previousSituation === normalizedSituation) {
    return { success: true };
  }

  const { error } = await supabase.rpc("update_case_situation", {
    p_case_id: caseId,
    p_situation: normalizedSituation ?? "",
  });

  if (error) {
    return { error: { _form: [error.message] } };
  }

  const description = normalizedSituation
    ? `عدّل موقف القضية ${caseItem.case_number}: «${normalizedSituation}»`
    : `مسح موقف القضية ${caseItem.case_number}`;

  await logActivity({
    userId: auth.profile.id,
    actionType: "update_case_situation",
    caseId,
    description,
    metadata: {
      case_number: caseItem.case_number,
      case_name: caseItem.case_name,
      old_situation: previousSituation,
      new_situation: normalizedSituation,
    },
  });

  revalidatePath("/");
  revalidatePath(`/cases/${caseId}`);
  revalidatePath("/activity-logs");
  return { success: true };
}
