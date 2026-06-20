import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { CaseMilestonesPanel } from "@/components/cases/case-milestones-panel";
import { StatusBadge } from "@/components/cases/status-badge";
import { DeleteCaseButton } from "@/components/cases/delete-case-button";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCaseById } from "@/lib/actions/cases";
import { getCurrentProfile } from "@/lib/actions/profile";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

interface CaseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { id } = await params;
  const [caseData, profile] = await Promise.all([
    getCaseById(id).catch(() => null),
    getCurrentProfile(),
  ]);

  if (!caseData) notFound();

  const isCoordinator = profile?.role === "coordinator";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <DashboardHeader
          title={caseData.case_name}
          description={`${caseData.case_number} — ${caseData.plaintiff_name} ضد ${caseData.defendant_name} · ${formatDate(caseData.created_at)}`}
        />
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href={`/cases/${id}/edit`} />}>
            <Pencil className="size-4" />
            تعديل
          </Button>
          {isCoordinator && <DeleteCaseButton caseId={id} />}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">الحالة:</span>
        <StatusBadge status={caseData.status} />
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <InfoRow label="رقم القضية" value={caseData.case_number} dir="ltr" />
          <InfoRow label="اسم القضية" value={caseData.case_name} />
        </CardContent>
      </Card>

      <CaseMilestonesPanel caseId={id} caseData={caseData} readOnly />

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
              name={caseData.coordinator?.full_name}
            />
            <TeamRow
              label={USER_ROLE_LABELS.expert}
              name={caseData.expert?.full_name}
            />
            <TeamRow
              label={USER_ROLE_LABELS.assistant}
              name={caseData.assistant?.full_name}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>بيانات المدعي</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="الاسم" value={caseData.plaintiff_name} />
            <InfoRow label="الهاتف" value={caseData.plaintiff_phone} dir="ltr" />
            <InfoRow
              label="البريد الإلكتروني"
              value={caseData.plaintiff_email}
              dir="ltr"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>بيانات المدعي عليه</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="الاسم" value={caseData.defendant_name} />
            <InfoRow label="الهاتف" value={caseData.defendant_phone} dir="ltr" />
            <InfoRow
              label="البريد الإلكتروني"
              value={caseData.defendant_email}
              dir="ltr"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DateRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{formatDate(value)}</span>
    </div>
  );
}

function TeamRow({ label, name }: { label: string; name?: string | null }) {
  return (
    <>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{name ?? "—"}</span>
      </div>
      <Separator />
    </>
  );
}

function InfoRow({
  label,
  value,
  dir,
}: {
  label: string;
  value: string | null;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium" dir={dir}>
        {value ?? "—"}
      </span>
    </div>
  );
}
