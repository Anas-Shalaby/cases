"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireCoordinator } from "@/lib/auth/require-coordinator";
import {
  expertEmailLogSchema,
  type ExpertEmailLogValues,
} from "@/lib/validations/expert-email-log";
import type { ExpertEmailLogWithExpert, Profile } from "@/types/database";

async function ensureCoordinator() {
  const auth = await requireCoordinator();
  if ("error" in auth) {
    throw new Error(auth.error._form[0]);
  }
  return auth.profile;
}

export async function getExpertEmailLogs(): Promise<
  ExpertEmailLogWithExpert[]
> {
  await ensureCoordinator();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expert_email_logs")
    .select(
      `
      *,
      expert:profiles!expert_email_logs_expert_id_fkey(id, full_name)
    `
    )
    .order("log_date", { ascending: false })
    .order("log_time", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ExpertEmailLogWithExpert[];
}

export async function getExperts(): Promise<
  Pick<Profile, "id" | "full_name">[]
> {
  await ensureCoordinator();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "expert")
    .order("full_name");

  if (error) throw new Error(error.message);
  return (data ?? []) as Pick<Profile, "id" | "full_name">[];
}

export async function createExpertEmailLog(values: ExpertEmailLogValues) {
  const parsed = expertEmailLogSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  try {
    await ensureCoordinator();
  } catch (e) {
    return {
      error: {
        _form: [e instanceof Error ? e.message : "غير مصرح"],
      },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("expert_email_logs").insert({
    log_date: parsed.data.log_date,
    log_time: parsed.data.log_time,
    last_email_subject: parsed.data.last_email_subject.trim(),
    expert_id: parsed.data.expert_id,
    action_taken: parsed.data.action_taken?.trim() ?? "",
  });

  if (error) return { error: { _form: [error.message] } };

  revalidatePath("/expert-emails");
  return { success: true };
}

export async function updateExpertEmailLog(
  id: string,
  values: ExpertEmailLogValues
) {
  const parsed = expertEmailLogSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  try {
    await ensureCoordinator();
  } catch (e) {
    return {
      error: {
        _form: [e instanceof Error ? e.message : "غير مصرح"],
      },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("expert_email_logs")
    .update({
      log_date: parsed.data.log_date,
      log_time: parsed.data.log_time,
      last_email_subject: parsed.data.last_email_subject.trim(),
      expert_id: parsed.data.expert_id,
      action_taken: parsed.data.action_taken?.trim() ?? "",
    })
    .eq("id", id);

  if (error) return { error: { _form: [error.message] } };

  revalidatePath("/expert-emails");
  return { success: true };
}

export async function deleteExpertEmailLog(id: string) {
  try {
    await ensureCoordinator();
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "غير مصرح",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("expert_email_logs")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/expert-emails");
  return { success: true };
}
