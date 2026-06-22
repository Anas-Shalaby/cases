import { redirect } from "next/navigation";

import { AddTeamMemberDialog } from "@/components/users/add-team-member-dialog";
import { TeamUsersList } from "@/components/users/team-users-list";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { getTeamMembers } from "@/lib/actions/manage-users";
import { getCurrentProfile } from "@/lib/actions/profile";

export default async function UsersManagementPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "coordinator") redirect("/");

  const members = await getTeamMembers();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <DashboardHeader
          title="إدارة أعضاء الفريق"
          description="إنشاء وإدارة حسابات المنسقين والخبراء ومساعدي الخبراء"
        />
        <AddTeamMemberDialog />
      </div>

      <TeamUsersList members={members} />
    </div>
  );
}
