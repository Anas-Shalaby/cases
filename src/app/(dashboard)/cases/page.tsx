import { CasesList } from "@/components/cases/cases-list";
import { CaseStatsCards } from "@/components/cases/case-stats-cards";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { getCaseStats, getCases } from "@/lib/actions/cases";
import { getCurrentProfile } from "@/lib/actions/profile";

export default async function CasesPage() {
  const [cases, profile, stats] = await Promise.all([
    getCases(),
    getCurrentProfile(),
    getCaseStats(),
  ]);
  const isCoordinator = profile?.role === "coordinator";

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="القضايا"
        description="إدارة ومتابعة جميع القضايا المسجلة في النظام"
      />

      <CaseStatsCards stats={stats} />

      <CasesList cases={cases} isCoordinator={isCoordinator} />
    </div>
  );
}
