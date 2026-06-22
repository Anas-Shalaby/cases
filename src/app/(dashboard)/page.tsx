import Link from "next/link";

import { CaseStatsCards } from "@/components/cases/case-stats-cards";
import { CasesTable } from "@/components/cases/cases-table";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { CoordinatorAlertsBanner } from "@/components/notifications/coordinator-alerts-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCaseStats, getCases } from "@/lib/actions/cases";
import { getCurrentProfile } from "@/lib/actions/profile";

export default async function DashboardPage() {
  const [stats, cases, profile] = await Promise.all([
    getCaseStats(),
    getCases(),
    getCurrentProfile(),
  ]);
  const recentCases = cases.slice(0, 5);
  const isCoordinator = profile?.role === "coordinator";

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="لوحة التحكم"
        description="نظرة عامة على حالة القضايا"
      />

      {isCoordinator && <CoordinatorAlertsBanner />}

      <CaseStatsCards stats={stats} />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>أحدث القضايا</CardTitle>
          <Button variant="outline" size="sm" render={<Link href="/cases" />}>
            عرض الكل
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <CasesTable cases={recentCases} canEdit={isCoordinator} />
        </CardContent>
      </Card>
    </div>
  );
}
