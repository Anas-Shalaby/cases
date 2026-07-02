import { CasesTable } from "@/components/cases/cases-table";
import { CreateCaseTaskDialog } from "@/components/dashboard/create-case-task-dialog";
import { ImportantAppointments } from "@/components/dashboard/important-appointments";
import { MyAssignedTasks } from "@/components/dashboard/my-assigned-tasks";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { CoordinatorAlertsBanner } from "@/components/notifications/coordinator-alerts-banner";
import { NavButton } from "@/components/ui/nav-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyAssignedTasks } from "@/lib/actions/case-tasks";
import { getCases } from "@/lib/actions/cases";
import {
  collectScheduleEvents,
  mergeScheduleEvents,
  tasksToScheduleEvents,
} from "@/lib/case-schedule";
import { getCurrentProfile } from "@/lib/actions/profile";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const isCoordinator = profile.role === "coordinator";
  const [cases, assignedTasks] = await Promise.all([
    getCases(),
    getMyAssignedTasks(),
  ]);

  const scheduleEvents = mergeScheduleEvents(
    collectScheduleEvents(cases, profile.id, profile.role),
    tasksToScheduleEvents(assignedTasks, profile.id)
  );
  const recentCases = cases.slice(0, 5);

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

      <MyAssignedTasks tasks={assignedTasks} />

      <ImportantAppointments events={scheduleEvents} />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>أحدث القضايا</CardTitle>
          <NavButton variant="outline" size="sm" href="/cases">
            عرض الكل
          </NavButton>
        </CardHeader>
        <CardContent className="pt-0">
          <CasesTable cases={recentCases} canEdit={isCoordinator} />
        </CardContent>
      </Card>
    </div>
  );
}
