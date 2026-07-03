"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/actions/profile";
import {
  canEditCaseSituation,
  canViewCaseSituations,
} from "@/lib/case-situation";
import { createClient } from "@/lib/supabase/server";
import {
  caseSituationSchema,
  emptySituation,
} from "@/lib/validations/case-situation";

export async function updateCaseSituation(caseId: string, situation: string) {
  const profile = await getCurrentProfile();
  if (!profile || !canViewCaseSituations(profile.role)) {
    return { error: { _form: ["غير مصرح بتحديث موقف القضية"] } };
  }

  const parsed = caseSituationSchema.safeParse({ situation });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { data: caseItem, error: fetchError } = await supabase
    .from("cases")
    .select("id, expert_id")
    .eq("id", caseId)
    .single();

  if (fetchError || !caseItem) {
    return { error: { _form: ["القضية غير موجودة"] } };
  }

  if (!canEditCaseSituation(profile.role, caseItem, profile.id)) {
    return { error: { _form: ["غير مصرح بتحديث موقف هذه القضية"] } };
  }

  const normalizedSituation = emptySituation(parsed.data.situation);

  const { error } = await supabase.rpc("update_case_situation", {
    p_case_id: caseId,
    p_situation: normalizedSituation ?? "",
  });

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/");
  revalidatePath(`/cases/${caseId}`);
  return { success: true };
}
