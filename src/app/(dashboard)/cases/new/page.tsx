import { CaseForm } from "@/components/cases/case-form";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { createCase, getProfiles } from "@/lib/actions/cases";

export default async function NewCasePage() {
  const profiles = await getProfiles();

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="إضافة قضية جديدة"
        description="أدخل بيانات القضية والأطراف المعنية"
      />
      <CaseForm profiles={profiles} onSubmit={createCase} submitLabel="إنشاء القضية" />
    </div>
  );
}
