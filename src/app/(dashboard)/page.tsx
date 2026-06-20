import Link from "next/link";

import { CaseStatsCards } from "@/components/cases/case-stats-cards";
import { CasesTable } from "@/components/cases/cases-table";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCaseStats, getCases } from "@/lib/actions/cases";

export default async function DashboardPage() {
  const [stats, cases] = await Promise.all([getCaseStats(), getCases()]);
  const recentCases = cases.slice(0, 5);

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="لوحة التحكم"
        description="نظرة عامة على حالة القضايا"
      />

      <CaseStatsCards stats={stats} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>أحدث القضايا</CardTitle>
          <Button variant="outline" size="sm" render={<Link href="/cases" />}>
            عرض الكل
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <CasesTable cases={recentCases} />
        </CardContent>
      </Card>
    </div>
  );
}
