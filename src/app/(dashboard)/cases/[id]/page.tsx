import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { CaseDocumentsPanel } from "@/components/cases/case-documents-panel";
import { CaseMilestonesPanel } from "@/components/cases/case-milestones-panel";
import { DeleteCaseButton } from "@/components/cases/delete-case-button";
import { ExportCaseButton } from "@/components/cases/export-case-button";
import { PartiesCard } from "@/components/cases/parties-display";
import { StatusBadge } from "@/components/cases/status-badge";
import { TeamMemberCasesLink } from "@/components/cases/team-member-cases-link";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { NavButton } from "@/components/ui/nav-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCaseById } from "@/lib/actions/cases";
import { getCaseDocuments } from "@/lib/actions/case-documents";
import { getCurrentProfile } from "@/lib/actions/profile";
import { formatCasePartiesSummary } from "@/lib/case-parties";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

interface CaseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { id } = await params;
  const [caseData, profile, documents] = await Promise.all([
    getCaseById(id).catch(() => null),
    getCurrentProfile(),
    getCaseDocuments(id).catch(() => []),
  ]);

  if (!caseData) notFound();

  const isCoordinator = profile?.role === "coordinator";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <DashboardHeader
          title={caseData.case_name}
          description={`${caseData.case_number} — ${formatCasePartiesSummary(caseData.parties)} · ${formatDate(caseData.created_at)}`}
        />
        <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto">
          <ExportCaseButton caseData={caseData} documents={documents} />
          {isCoordinator && (
            <NavButton
              variant="outline"
              className="flex-1 sm:flex-none"
              href={`/cases/${id}/edit`}
            >
              <Pencil className="size-4" />
              تعديل
            </NavButton>
          )}
          {isCoordinator && <DeleteCaseButton caseId={id} />}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">الحالة:</span>
        <StatusBadge status={caseData.status} />
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <DetailInfoRow label="رقم القضية" value={caseData.case_number} dir="ltr" />
          <DetailInfoRow label="اسم القضية" value={caseData.case_name} />
        </CardContent>
      </Card>

      <CaseMilestonesPanel caseId={id} caseData={caseData} readOnly />

      <CaseDocumentsPanel
        caseId={id}
        documents={documents}
        canManage={isCoordinator}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>التواريخ المهمة</CardTitle>
            <CardDescription>مواعيد القضية الرئيسية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <DateRow label="تاريخ التكليف" value={caseData.assignment_date} />
            <DateRow label="تاريخ الاجتماع" value={caseData.meeting_date} />
            <DateRow
              label="تاريخ التقرير الأولي"
              value={caseData.initial_report_date}
            />
            <DateRow
              label="تاريخ التقرير النهائي"
              value={caseData.final_report_date}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>فريق العمل</CardTitle>
            <CardDescription>المسؤولون عن القضية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <TeamRow
              label={USER_ROLE_LABELS.coordinator}
              memberName={caseData.coordinator?.full_name}
            />
            <TeamRow
              label={USER_ROLE_LABELS.expert}
              memberId={caseData.expert_id}
              memberName={caseData.expert?.full_name}
              role="expert"
            />
            <TeamRow
              label={USER_ROLE_LABELS.assistant}
              memberId={caseData.assistant_id}
              memberName={caseData.assistant?.full_name}
              role="assistant"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>بيانات المدعي</CardTitle>
          </CardHeader>
          <CardContent>
            <PartiesCard
              parties={caseData.parties}
              title="بيانات المدعي"
              partyType="plaintiff"
              partyLabel="المدعي"
              agentTitle="بيانات وكيل المدعي"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>بيانات المدعي عليه</CardTitle>
          </CardHeader>
          <CardContent>
            <PartiesCard
              parties={caseData.parties}
              title="بيانات المدعي عليه"
              partyType="defendant"
              partyLabel="المدعي عليه"
              agentTitle="بيانات وكيل المدعي عليه"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DateRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium sm:text-left">{formatDate(value)}</span>
    </div>
  );
}

function TeamRow({
  label,
  memberId,
  memberName,
  role,
}: {
  label: string;
  memberId?: string | null;
  memberName?: string | null;
  role?: "expert" | "assistant";
}) {
  return (
    <>
      <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-muted-foreground shrink-0">{label}</span>
        <span className="truncate font-medium sm:max-w-[60%] sm:text-left">
          {role ? (
            <TeamMemberCasesLink
              memberId={memberId}
              memberName={memberName}
              role={role}
            />
          ) : (
            (memberName ?? "—")
          )}
        </span>
      </div>
      <Separator />
    </>
  );
}

function DetailInfoRow({
  label,
  value,
  dir,
}: {
  label: string;
  value: string | null;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-start sm:justify-between">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span
        className="break-all font-medium sm:max-w-[65%] sm:text-left"
        dir={dir}
      >
        {value ?? "—"}
      </span> 
    </div>
  );
}
