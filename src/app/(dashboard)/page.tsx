import { CasesTable } from "@/components/cases/cases-table";
import { DashboardInsights } from "@/components/dashboard/dashboard-insights";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { CoordinatorAlertsBanner } from "@/components/notifications/coordinator-alerts-banner";
import { NavButton } from "@/components/ui/nav-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCases, getDashboardOverview } from "@/lib/actions/cases";
import { getCurrentProfile } from "@/lib/actions/profile";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const isCoordinator = profile?.role === "coordinator";

  const [overview, cases] = await Promise.all([
    getDashboardOverview(isCoordinator),
    getCases(),
  ]);

  const recentCases = cases.slice(0, 5);

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="لوحة التحكم"
        description="نظرة عامة على حالة القضايا والمواعيد والإحصائيات"
      />

      {isCoordinator && <CoordinatorAlertsBanner />}

      <DashboardInsights
        overview={overview}
        isCoordinator={isCoordinator}
        canEdit={isCoordinator}
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>أحدث القضايا</CardTitle>
          <NavButton variant="outline" size="sm" href="/cases">
            عرض الكل
          </NavButton>
        </CardHeader>
        <CardContent className="pt-0">
          <CasesTable cases={recentCases} canEdit={isCoordinator} />
        </CardContent>
      </Card>
    </div>
  );
}
