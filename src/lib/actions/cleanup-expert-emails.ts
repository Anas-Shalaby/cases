import { createAdminClient } from "@/lib/supabase/admin";

export async function cleanupOldExpertEmailLogs() {
  const admin = createAdminClient();
  
  // Get date 7 days ago
  const date = new Date();
  date.setDate(date.getDate() - 7);
  const formattedDate = date.toISOString().split("T")[0];

  const { error, count } = await admin
    .from("expert_email_logs")
    .delete({ count: "exact" })
    .lt("log_date", formattedDate);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, deletedCount: count ?? 0 };
}
