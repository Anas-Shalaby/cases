import { CasesList } from "@/components/cases/cases-list";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { getCases } from "@/lib/actions/cases";
import { getCurrentProfile } from "@/lib/actions/profile";
import { USER_ROLE_LABELS } from "@/lib/constants";
import type { CaseStatus } from "@/types/database";

interface CasesPageProps {
  searchParams: Promise<{
    status?: string;
    expert?: string;
    assistant?: string;
  }>;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CasesPage({ searchParams }: CasesPageProps) {
  const { status, expert, assistant } = await searchParams;
  const initialStatus =
    status === "open" || status === "delayed" || status === "closed"
      ? (status as CaseStatus)
      : "all";

  const [cases, profile] = await Promise.all([
    getCases(),
    getCurrentProfile(),
  ]);
  const isCoordinator = profile?.role === "coordinator";
  const isExpert = profile?.role === "expert";

  let expertId: string | undefined;
  let assistantId: string | undefined;
  let memberFilterName: string | undefined;
  let memberFilterRole: "expert" | "assistant" | undefined;

  if (expert && UUID_RE.test(expert)) {
    expertId = expert;
    memberFilterRole = "expert";
    memberFilterName =
      cases.find((c) => c.expert_id === expert)?.expert?.full_name ??
      undefined;
  } else if (assistant && UUID_RE.test(assistant)) {
    assistantId = assistant;
    memberFilterRole = "assistant";
    memberFilterName =
      cases.find((c) => c.assistant_id === assistant)?.assistant?.full_name ??
      undefined;
  }

  const roleLabel = memberFilterRole
    ? USER_ROLE_LABELS[memberFilterRole]
    : undefined;

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="القضايا"
        description={
          memberFilterName && roleLabel
            ? `قضايا ${roleLabel}: ${memberFilterName}`
            : "إدارة ومتابعة جميع القضايا المسجلة في النظام"
        }
      />

      <CasesList
        cases={cases}
        isCoordinator={isCoordinator}
        initialStatusFilter={initialStatus}
        expertId={expertId}
        assistantId={assistantId}
        memberFilterName={memberFilterName}
        memberFilterRole={memberFilterRole}
        enableExpertExport={isExpert || !!expertId}
        exportExpertName={
          memberFilterName ?? (isExpert ? profile?.full_name : undefined)
        }
      />
    </div>
  );
}
