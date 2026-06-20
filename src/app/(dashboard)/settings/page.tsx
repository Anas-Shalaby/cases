import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { getCurrentProfile } from "@/lib/actions/profile";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="الإعدادات"
        description="إدارة بيانات حسابك الشخصي"
      />
      <ProfileSettingsForm profile={profile} />
    </div>
  );
}
