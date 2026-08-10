import { redirect } from "next/navigation";

import { ExpertEmailLogsTable } from "@/components/expert-email-logs/expert-email-logs-table";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import {
  getExpertEmailLogs,
  getExperts,
} from "@/lib/actions/expert-email-logs";
import { getCurrentProfile } from "@/lib/actions/profile";

export default async function ExpertEmailsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "coordinator") redirect("/");

  const [logs, experts] = await Promise.all([
    getExpertEmailLogs(),
    getExperts(),
  ]);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="سجل البريد الإلكتروني"
        description="تسجيل ومتابعة آخر الإيميلات الواردة من الخبراء والردود عليها"
      />
      <ExpertEmailLogsTable logs={logs} experts={experts} />
    </div>
  );
}
