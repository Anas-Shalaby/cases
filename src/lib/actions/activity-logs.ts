"use server";

import { createClient } from "@/lib/supabase/server";
import { requireCoordinator } from "@/lib/auth/require-coordinator";
import type { ActivityLogWithRelations, LogActionType } from "@/types/database";

interface LogActivityInput {
  userId: string;
  actionType: LogActionType;
  description: string;
  caseId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logActivity({
  userId,
  actionType,
  description,
  caseId = null,
  metadata,
}: LogActivityInput): Promise<void> {
  const supabase = await createClient();

  await supabase.from("activity_logs").insert({
    user_id: userId,
    action_type: actionType,
    case_id: caseId,
    description,
    metadata: metadata ?? null,
  });
}

export async function getActivityLogs(
  limit = 100
): Promise<ActivityLogWithRelations[]> {
  const auth = await requireCoordinator();
  if ("error" in auth) {
    throw new Error(auth.error._form[0]);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select(
      `
      *,
      actor:profiles!activity_logs_user_id_fkey(id, full_name),
      case:cases!activity_logs_case_id_fkey(id, case_number, case_name)
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as ActivityLogWithRelations[];
}
