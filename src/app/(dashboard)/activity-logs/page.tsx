import { redirect } from "next/navigation";

import { ActivityLogsList } from "@/components/activity-logs/activity-logs-list";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { getActivityLogs } from "@/lib/actions/activity-logs";
import { getCurrentProfile } from "@/lib/actions/profile";

export default async function ActivityLogsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "coordinator") redirect("/");

  const logs = await getActivityLogs();

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="سجل الأنشطة"
        description="متابعة إجراءات المنسقين: إنشاء وتعديل القضايا، إضافة الأعضاء، ورفع المستندات"
      />
      <ActivityLogsList logs={logs} />
    </div>
  );
}
