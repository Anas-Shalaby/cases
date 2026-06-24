"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireCoordinator } from "@/lib/auth/require-coordinator";
import { logActivity } from "@/lib/actions/activity-logs";
import { CASE_MILESTONE_KEYS } from "@/lib/case-milestones";
import { collectCaseDeadlines, type DashboardOverview } from "@/lib/case-deadlines";
import {
  CASE_STATUS_LABELS,
} from "@/lib/constants";
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

export async function getDashboardOverview(
  isCoordinator = false
): Promise<DashboardOverview> {
  const [stats, cases] = await Promise.all([getCaseStats(), getCases()]);

  const activeCases = cases.filter((c) => c.status !== "closed");
  const delayedCases = cases
    .filter((c) => c.status === "delayed")
    .slice(0, 5);

  const allDeadlines = collectCaseDeadlines(activeCases);
  const overdueDeadlines = allDeadlines
    .filter((d) => d.isOverdue)
    .sort((a, b) => a.deadlineDate.localeCompare(b.deadlineDate))
    .slice(0, 5);

  const upcomingDeadlines = allDeadlines
    .filter((d) => !d.isOverdue && d.daysUntil <= 7)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  const totalMilestones = activeCases.length * CASE_MILESTONE_KEYS.length;
  let completedMilestones = 0;

  for (const caseItem of activeCases) {
    for (const key of CASE_MILESTONE_KEYS) {
      if (caseItem[key]) completedMilestones++;
    }
  }

  const averageCompletion =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;

  let teamCount: number | undefined;
  if (isCoordinator) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .in("role", ["coordinator", "expert", "assistant"]);
    teamCount = count ?? 0;
  }

  return {
    stats,
    delayedCases,
    overdueDeadlines,
    upcomingDeadlines,
    milestoneProgress: {
      totalMilestones,
      completedMilestones,
      averageCompletion,
    },
    teamCount,
  };
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
  const auth = await requireCoordinator();
  if ("error" in auth) return { error: auth.error };

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

  const caseId = (data as { id: string }).id;
  await logActivity({
    userId: auth.profile.id,
    actionType: "create_case",
    caseId,
    description: `أنشأ قضية جديدة: ${payload.case_number} — ${payload.case_name}`,
    metadata: {
      case_number: payload.case_number,
      case_name: payload.case_name,
      status: payload.status,
    },
  });

  revalidatePath("/");
  revalidatePath("/cases");
  revalidatePath("/activity-logs");
  return { success: true, id: caseId };
}

export async function updateCase(id: string, values: CaseFormValues) {
  const auth = await requireCoordinator();
  if ("error" in auth) return { error: auth.error };

  const parsed = caseFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { data: existingCase } = await supabase
    .from("cases")
    .select("case_number, case_name, status")
    .eq("id", id)
    .single();

  const payload = toCasePayload(parsed.data);
  const { error } = await supabase.from("cases").update(payload).eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: { case_number: ["رقم القضية مستخدم بالفعل"] } };
    }
    return { error: { _form: [error.message] } };
  }

  const oldStatus = existingCase?.status as string | undefined;
  const statusChanged = oldStatus && oldStatus !== payload.status;
  const description = statusChanged
    ? `عدّل القضية ${payload.case_number}: غيّر الحالة من «${CASE_STATUS_LABELS[oldStatus as keyof typeof CASE_STATUS_LABELS]}» إلى «${CASE_STATUS_LABELS[payload.status]}»`
    : `عدّل بيانات القضية ${payload.case_number} — ${payload.case_name}`;

  await logActivity({
    userId: auth.profile.id,
    actionType: "update_case",
    caseId: id,
    description,
    metadata: {
      case_number: payload.case_number,
      case_name: payload.case_name,
      ...(statusChanged
        ? { old_status: oldStatus, new_status: payload.status }
        : {}),
    },
  });

  revalidatePath("/");
  revalidatePath("/cases");
  revalidatePath(`/cases/${id}`);
  revalidatePath("/activity-logs");
  return { success: true, id };
}

export async function deleteCase(id: string) {
  const auth = await requireCoordinator();
  if ("error" in auth) return { error: auth.error._form[0] };

  const supabase = await createClient();

  const { data: existingCase } = await supabase
    .from("cases")
    .select("case_number, case_name")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("cases").delete().eq("id", id);

  if (error) return { error: error.message };

  if (existingCase) {
    await logActivity({
      userId: auth.profile.id,
      actionType: "delete_case",
      caseId: null,
      description: `حذف القضية ${existingCase.case_number} — ${existingCase.case_name}`,
      metadata: {
        case_number: existingCase.case_number,
        case_name: existingCase.case_name,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/cases");
  revalidatePath("/activity-logs");
  redirect("/cases");
}
