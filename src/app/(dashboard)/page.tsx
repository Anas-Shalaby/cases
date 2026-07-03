import { CaseSituationsPanel } from "@/components/dashboard/case-situations-panel";
import { CreateCaseTaskDialog } from "@/components/dashboard/create-case-task-dialog";
import { ImportantAppointments } from "@/components/dashboard/important-appointments";
import { MyAssignedTasks } from "@/components/dashboard/my-assigned-tasks";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { CoordinatorAlertsBanner } from "@/components/notifications/coordinator-alerts-banner";
import { getMyAssignedTasks } from "@/lib/actions/case-tasks";
import { getCases } from "@/lib/actions/cases";
import {
  collectScheduleEvents,
  mergeScheduleEvents,
  tasksToScheduleEvents,
} from "@/lib/case-schedule";
import { canViewCaseSituations } from "@/lib/case-situation";
import { getCurrentProfile } from "@/lib/actions/profile";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const isCoordinator = profile.role === "coordinator";
  const showSituations = canViewCaseSituations(profile.role);
  const [cases, assignedTasks] = await Promise.all([
    getCases(),
    getMyAssignedTasks(),
  ]);

  const scheduleEvents = mergeScheduleEvents(
    collectScheduleEvents(cases, profile.id, profile.role),
    tasksToScheduleEvents(assignedTasks, profile.id)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <DashboardHeader
          title="لوحة التحكم"
          description="مواعيدك ومهامك لهذا الأسبوع في لمحة سريعة"
        />
        {isCoordinator && <CreateCaseTaskDialog cases={cases} />}
      </div>

      {isCoordinator && <CoordinatorAlertsBanner />}

      {showSituations && (
        <CaseSituationsPanel
          cases={cases}
          currentUserId={profile.id}
          currentUserRole={profile.role}
        />
      )}

      <MyAssignedTasks tasks={assignedTasks} />

      <ImportantAppointments events={scheduleEvents} />
    </div>
  );
}
