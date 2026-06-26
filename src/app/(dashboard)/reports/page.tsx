import { redirect } from "next/navigation";

import { MonthlyReportsPanel } from "@/components/reports/monthly-reports-panel";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { getCases, getProfiles } from "@/lib/actions/cases";
import { getCurrentProfile } from "@/lib/actions/profile";

export default async function MonthlyReportsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [cases, profiles] = await Promise.all([getCases(), getProfiles()]);
  const isCoordinator = profile.role === "coordinator";

  const coordinators = profiles
    .filter((p) => p.role === "coordinator")
    .map((p) => ({ id: p.id, full_name: p.full_name }));

  const experts = profiles
    .filter((p) => p.role === "expert")
    .map((p) => ({ id: p.id, full_name: p.full_name }));

  const assistants = profiles
    .filter((p) => p.role === "assistant")
    .map((p) => ({ id: p.id, full_name: p.full_name }));

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="التقارير الشهرية"
        description={
          isCoordinator
            ? "تقرير القضايا حسب الفترة الزمنية وفريق العمل مع إمكانية التصدير"
            : "تقرير قضاياك حسب الفترة الزمنية مع إمكانية التصدير"
        }
      />

      <MonthlyReportsPanel
        cases={cases}
        coordinators={coordinators}
        experts={experts}
        assistants={assistants}
        isCoordinator={isCoordinator}
        currentRole={profile.role}
        currentUserId={profile.id}
        currentUserName={profile.full_name}
      />
    </div>
  );
}
