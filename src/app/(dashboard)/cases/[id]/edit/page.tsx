import { notFound } from "next/navigation";

import { CaseForm } from "@/components/cases/case-form";
import { CaseMilestonesPanel } from "@/components/cases/case-milestones-panel";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { getCaseById, getProfiles, updateCase } from "@/lib/actions/cases";

interface EditCasePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCasePage({ params }: EditCasePageProps) {
  const { id } = await params;
  const [caseData, profiles] = await Promise.all([
    getCaseById(id).catch(() => null),
    getProfiles(),
  ]);

  if (!caseData) notFound();

  const handleUpdate = updateCase.bind(null, id);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="تعديل القضية"
        description={`${caseData.case_number} — ${caseData.case_name}`}
      />
      <CaseForm
        profiles={profiles}
        initialData={caseData}
        onSubmit={handleUpdate}
        submitLabel="حفظ التعديلات"
      />
      <CaseMilestonesPanel caseId={id} caseData={caseData} />
    </div>
  );
}
