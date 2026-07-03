import { CaseSituationsTable } from "@/components/dashboard/case-situations-table";
import { NavButton } from "@/components/ui/nav-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { filterCasesForSituationPanel } from "@/lib/case-situation";
import type { CaseWithRelations, UserRole } from "@/types/database";

interface CaseSituationsPanelProps {
  cases: CaseWithRelations[];
  currentUserId: string;
  currentUserRole: UserRole;
}

export function CaseSituationsPanel({
  cases,
  currentUserId,
  currentUserRole,
}: CaseSituationsPanelProps) {
  const situationCases = filterCasesForSituationPanel(
    cases,
    currentUserRole,
    currentUserId
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle>موقف القضية</CardTitle>
          <CardDescription>
            آخر موقف لكل قضية نشطة — يمكن تحديثه في أي وقت
          </CardDescription>
        </div>
        <NavButton variant="outline" size="sm" href="/cases">
          عرض الكل
        </NavButton>
      </CardHeader>
      <CardContent className="pt-0">
        <CaseSituationsTable
          cases={situationCases}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
        />
      </CardContent>
    </Card>
  );
}
