import { CasesList } from "@/components/cases/cases-list";
import { CaseStatsCards } from "@/components/cases/case-stats-cards";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { getCaseStats, getCases } from "@/lib/actions/cases";
import { getCurrentProfile } from "@/lib/actions/profile";
import type { CaseStatus } from "@/types/database";

interface CasesPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function CasesPage({ searchParams }: CasesPageProps) {
  const { status } = await searchParams;
  const initialStatus =
    status === "open" || status === "delayed" || status === "closed"
      ? (status as CaseStatus)
      : "all";

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

      <CasesList
        cases={cases}
        isCoordinator={isCoordinator}
        initialStatusFilter={initialStatus}
      />
    </div>
  );
}
