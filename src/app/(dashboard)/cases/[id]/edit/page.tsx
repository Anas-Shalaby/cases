import { notFound, redirect } from "next/navigation";

import { CaseForm } from "@/components/cases/case-form";
import { CaseMilestonesPanel } from "@/components/cases/case-milestones-panel";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { getCaseById, getProfiles, updateCase } from "@/lib/actions/cases";
import { getCurrentProfile } from "@/lib/actions/profile";

interface EditCasePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCasePage({ params }: EditCasePageProps) {
  const { id } = await params;
  const [caseData, profiles, profile] = await Promise.all([
    getCaseById(id).catch(() => null),
    getProfiles(),
    getCurrentProfile(),
  ]);

  if (!caseData) notFound();
  if (!profile) redirect("/login");
  if (profile.role !== "coordinator") redirect(`/cases/${id}`);

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
