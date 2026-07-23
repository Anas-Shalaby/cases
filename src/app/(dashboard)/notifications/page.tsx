import { redirect } from "next/navigation";

import { NotificationsList } from "@/components/notifications/notifications-list";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { getNotifications } from "@/lib/actions/notifications";
import { getCurrentProfile } from "@/lib/actions/profile";
import { canAccessNotifications } from "@/lib/notifications-access";

const PAGE_DESCRIPTIONS = {
  coordinator:
    "متابعة مواعيد التقارير والاجتماعات والمستندات لجميع القضايا في النظام",
  expert: "إشعارات القضايا المُسندة إليك وتحديثاتها",
  assistant: "إشعاراتك وتحديثات القضايا المرتبطة بك",
} as const;

interface NotificationsPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const { page: pageStr } = await searchParams;
  const page = pageStr ? parseInt(pageStr, 10) : 1;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!canAccessNotifications(profile.role)) redirect("/");

  const { data: notifications, total } = await getNotifications(20, { page });
  const description =
    PAGE_DESCRIPTIONS[profile.role as keyof typeof PAGE_DESCRIPTIONS] ??
    "إشعاراتك";

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="التنبيهات والإشعارات"
        description={description}
      />
      <NotificationsList notifications={notifications} total={total} currentPage={page} />
    </div>
  );
}
