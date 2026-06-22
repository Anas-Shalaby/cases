"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/actions/profile";
import { canAccessNotifications } from "@/lib/notifications-access";
import type { NotificationWithCase } from "@/types/database";

async function requireNotificationAccess() {
  const profile = await getCurrentProfile();
  if (!profile || !canAccessNotifications(profile.role)) {
    throw new Error("غير مصرح");
  }
  return profile;
}

export async function syncDeadlineNotifications(): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "coordinator") return;

  const supabase = await createClient();
  const { error } = await supabase.rpc("sync_deadline_notifications");
  if (error) throw new Error(error.message);
}

export async function getNotifications(
  limit = 50
): Promise<NotificationWithCase[]> {
  const profile = await requireNotificationAccess();

  if (profile.role === "coordinator") {
    await syncDeadlineNotifications();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(
      `
      *,
      case:cases!notifications_case_id_fkey(id, case_number, case_name)
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as NotificationWithCase[];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const profile = await getCurrentProfile();
  if (!profile || !canAccessNotifications(profile.role)) return 0;

  if (profile.role === "coordinator") {
    await syncDeadlineNotifications();
  }

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<{ error?: string }> {
  try {
    await requireNotificationAccess();
    const supabase = await createClient();

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) return { error: error.message };

    revalidatePath("/notifications");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "حدث خطأ" };
  }
}

export async function markAllNotificationsAsRead(): Promise<{ error?: string }> {
  try {
    await requireNotificationAccess();
    const supabase = await createClient();

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("is_read", false);

    if (error) return { error: error.message };

    revalidatePath("/notifications");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "حدث خطأ" };
  }
}

export async function deleteNotification(
  notificationId: string
): Promise<{ error?: string }> {
  try {
    await requireNotificationAccess();
    const supabase = await createClient();

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) return { error: error.message };

    revalidatePath("/notifications");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "حدث خطأ" };
  }
}
