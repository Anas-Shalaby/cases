"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/actions/profile";
import { requireCoordinator } from "@/lib/auth/require-coordinator";
import { createClient } from "@/lib/supabase/server";
import {
  createCaseTaskSchema,
  type CreateCaseTaskValues,
} from "@/lib/validations/case-task";
import type { CaseTaskWithRelations } from "@/types/database";

const TASK_SELECT = `
  *,
  assignee:profiles!case_tasks_assigned_to_fkey(id, full_name, role),
  creator:profiles!case_tasks_created_by_fkey(id, full_name),
  case:cases!case_tasks_case_id_fkey(id, case_number, case_name)
`;

function isOnCaseTeam(
  team: {
    coordinator_id: string | null;
    expert_id: string | null;
    assistant_id: string | null;
  },
  userId: string
): boolean {
  return (
    team.coordinator_id === userId ||
    team.expert_id === userId ||
    team.assistant_id === userId
  );
}

export async function getCaseTasks(
  caseId: string
): Promise<CaseTaskWithRelations[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("case_tasks")
    .select(TASK_SELECT)
    .eq("case_id", caseId)
    .order("due_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CaseTaskWithRelations[];
}

export async function getMyAssignedTasks(): Promise<CaseTaskWithRelations[]> {
  const profile = await getCurrentProfile();
  if (!profile) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("case_tasks")
    .select(TASK_SELECT)
    .eq("assigned_to", profile.id)
    .order("status", { ascending: true })
    .order("due_date", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CaseTaskWithRelations[];
}

export async function getAllCaseTasks(): Promise<CaseTaskWithRelations[]> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "coordinator") return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("case_tasks")
    .select(TASK_SELECT)
    .order("status", { ascending: true })
    .order("due_date", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CaseTaskWithRelations[];
}

export async function createCaseTask(
  values: CreateCaseTaskValues
): Promise<{ error?: string }> {
  const auth = await requireCoordinator();
  if ("error" in auth) return { error: auth.error._form[0] };

  const parsed = createCaseTaskSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const supabase = await createClient();

  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .select("id, case_number, case_name, coordinator_id, expert_id, assistant_id, status")
    .eq("id", parsed.data.case_id)
    .single();

  if (caseError || !caseRow) {
    return { error: "القضية غير موجودة" };
  }

  if (caseRow.status === "closed") {
    return { error: "لا يمكن إسناد مهام لقضية مغلقة" };
  }

  if (!isOnCaseTeam(caseRow, parsed.data.assigned_to)) {
    return { error: "يجب إسناد المهمة لعضو في فريق القضية فقط" };
  }

  const { error } = await supabase.from("case_tasks").insert({
    case_id: parsed.data.case_id,
    title: parsed.data.title,
    description: parsed.data.description?.trim() || null,
    due_date: parsed.data.due_date,
    assigned_to: parsed.data.assigned_to,
    created_by: auth.profile.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/cases/${parsed.data.case_id}`);
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/schedule");
  revalidatePath("/notifications");
  return {};
}

export async function completeCaseTask(
  taskId: string
): Promise<{ error?: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "غير مصرح" };

  const supabase = await createClient();

  const { data: task, error: fetchError } = await supabase
    .from("case_tasks")
    .select("id, case_id, assigned_to, status, title")
    .eq("id", taskId)
    .single();

  if (fetchError || !task) {
    return { error: "المهمة غير موجودة" };
  }

  if (task.assigned_to !== profile.id) {
    return { error: "غير مصرح — هذه المهمة ليست مُسندة إليك" };
  }

  if (task.status === "completed") {
    return { error: "المهمة مكتملة بالفعل" };
  }

  const completedAt = new Date().toISOString();

  const { error } = await supabase
    .from("case_tasks")
    .update({
      status: "completed",
      completed_at: completedAt,
    })
    .eq("id", taskId);

  if (error) return { error: error.message };

  revalidatePath(`/cases/${task.case_id}`);
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/schedule");
  return {};
}

export async function deleteCaseTask(
  taskId: string,
  caseId: string
): Promise<{ error?: string }> {
  const auth = await requireCoordinator();
  if ("error" in auth) return { error: auth.error._form[0] };

  const supabase = await createClient();

  const { error } = await supabase.from("case_tasks").delete().eq("id", taskId);

  if (error) return { error: error.message };

  revalidatePath(`/cases/${caseId}`);
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/schedule");
  return {};
}
