import { redirect } from "next/navigation";

import { NotificationsList } from "@/components/notifications/notifications-list";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { getNotifications } from "@/lib/actions/notifications";
import { getCurrentProfile } from "@/lib/actions/profile";
import { canAccessNotifications } from "@/lib/notifications-access";

const PAGE_DESCRIPTIONS = {
  coordinator:
    "متابعة مواعيد التقارير والاجتماعات والمستندات والقضايا المسندة",
  expert: "إشعارات القضايا المُسندة إليك وتحديثاتها",
  assistant: "إشعاراتك وتحديثات القضايا المرتبطة بك",
} as const;

export default async function NotificationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!canAccessNotifications(profile.role)) redirect("/");

  const notifications = await getNotifications();
  const description =
    PAGE_DESCRIPTIONS[profile.role as keyof typeof PAGE_DESCRIPTIONS] ??
    "إشعاراتك";

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="التنبيهات والإشعارات"
        description={description}
      />
      <NotificationsList notifications={notifications} />
    </div>
  );
}
