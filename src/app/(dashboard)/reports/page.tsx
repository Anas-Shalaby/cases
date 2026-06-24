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

  const experts = profiles.filter((p) => p.role === "expert");

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="التقارير الشهرية"
        description={
          isCoordinator
            ? "متابعة أداء القضايا شهرياً وتصدير تقارير الخبراء"
            : "متابعة قضاياك الشهرية وتصديرها"
        }
      />

      <MonthlyReportsPanel
        cases={cases}
        experts={experts}
        isCoordinator={isCoordinator}
        currentUserId={profile.role === "expert" ? profile.id : undefined}
      />
    </div>
  );
}
