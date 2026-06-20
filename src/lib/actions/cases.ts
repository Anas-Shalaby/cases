"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  caseFormSchema,
  emptyDate,
  emptyUuid,
  type CaseFormValues,
} from "@/lib/validations/case";
import type { CaseWithRelations, Profile } from "@/types/database";

export async function getCases(): Promise<CaseWithRelations[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cases")
    .select(
      `
      *,
      coordinator:profiles!cases_coordinator_id_fkey(id, full_name),
      expert:profiles!cases_expert_id_fkey(id, full_name),
      assistant:profiles!cases_assistant_id_fkey(id, full_name)
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as CaseWithRelations[];
}

export async function getCaseById(id: string): Promise<CaseWithRelations> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cases")
    .select(
      `
      *,
      coordinator:profiles!cases_coordinator_id_fkey(id, full_name),
      expert:profiles!cases_expert_id_fkey(id, full_name),
      assistant:profiles!cases_assistant_id_fkey(id, full_name)
    `
    )
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data as CaseWithRelations;
}

export async function getProfiles(): Promise<
  Pick<Profile, "id" | "full_name" | "role">[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .order("full_name");

  if (error) throw new Error(error.message);
  return (data ?? []) as Pick<Profile, "id" | "full_name" | "role">[];
}

export async function getCaseStats() {
  const supabase = await createClient();

  const { data, error } = await supabase.from("cases").select("status");

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as { status: string }[];

  const stats = {
    total: rows.length,
    open: rows.filter((c) => c.status === "open").length,
    delayed: rows.filter((c) => c.status === "delayed").length,
    closed: rows.filter((c) => c.status === "closed").length,
  };

  return stats;
}

function toCasePayload(values: CaseFormValues) {
  return {
    case_number: values.case_number.trim(),
    case_name: values.case_name.trim(),
    status: values.status,
    assignment_date: emptyDate(values.assignment_date),
    meeting_date: emptyDate(values.meeting_date),
    initial_report_date: emptyDate(values.initial_report_date),
    final_report_date: emptyDate(values.final_report_date),
    plaintiff_name: values.plaintiff_name,
    plaintiff_phone: values.plaintiff_phone || null,
    plaintiff_email: values.plaintiff_email || null,
    defendant_name: values.defendant_name,
    defendant_phone: values.defendant_phone || null,
    defendant_email: values.defendant_email || null,
    coordinator_id: emptyUuid(values.coordinator_id),
    expert_id: emptyUuid(values.expert_id),
    assistant_id: emptyUuid(values.assistant_id),
  };
}

export async function createCase(values: CaseFormValues) {
  const parsed = caseFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const payload = toCasePayload(parsed.data);

  if (!payload.coordinator_id && user) {
    payload.coordinator_id = user.id;
  }

  const { data, error } = await supabase
    .from("cases")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: { case_number: ["رقم القضية مستخدم بالفعل"] } };
    }
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/");
  revalidatePath("/cases");
  redirect(`/cases/${(data as { id: string }).id}`);
}

export async function updateCase(id: string, values: CaseFormValues) {
  const parsed = caseFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("cases")
    .update(toCasePayload(parsed.data))
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: { case_number: ["رقم القضية مستخدم بالفعل"] } };
    }
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/");
  revalidatePath("/cases");
  revalidatePath(`/cases/${id}`);
  redirect(`/cases/${id}`);
}

export async function deleteCase(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cases").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/cases");
  redirect("/cases");
}
