import { NotificationBell } from "@/components/notifications/notification-bell";
import { getNotifications } from "@/lib/actions/notifications";
import { getCurrentProfile } from "@/lib/actions/profile";
import { canAccessNotifications } from "@/lib/notifications-access";

export async function NotificationBellLoader() {
  const profile = await getCurrentProfile();
  if (!profile || !canAccessNotifications(profile.role)) return null;

  const notifications = await getNotifications(5, { syncDeadlines: false });
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationBell
      notifications={notifications}
      unreadCount={unreadCount}
    />
  );
}
