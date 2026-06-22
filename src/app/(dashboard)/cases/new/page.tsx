import { redirect } from "next/navigation";

import { CaseForm } from "@/components/cases/case-form";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { createCase, getProfiles } from "@/lib/actions/cases";
import { getCurrentProfile } from "@/lib/actions/profile";

export default async function NewCasePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "coordinator") redirect("/cases");

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
