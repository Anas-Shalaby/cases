import { CreateCaseTaskDialog } from "@/components/dashboard/create-case-task-dialog";
import { TasksList } from "@/components/tasks/tasks-list";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { getAllCaseTasks, getMyAssignedTasks } from "@/lib/actions/case-tasks";
import { getCases } from "@/lib/actions/cases";
import { getCurrentProfile } from "@/lib/actions/profile";
import { redirect } from "next/navigation";

export default async function TasksPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const isCoordinator = profile.role === "coordinator";

  const [myTasks, allTasks, cases] = await Promise.all([
    getMyAssignedTasks(),
    isCoordinator ? getAllCaseTasks() : Promise.resolve([]),
    isCoordinator ? getCases() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <DashboardHeader
          title="المهام"
          description={
            isCoordinator
              ? "المهام المُسندة إليك وكل المهام في النظام"
              : "جميع المهام المُسندة إليك من المنسق"
          }
        />
        {isCoordinator && <CreateCaseTaskDialog cases={cases} />}
      </div>

      <TasksList
        myTasks={myTasks}
        allTasks={allTasks}
        isCoordinator={isCoordinator}
        currentUserId={profile.id}
      />
    </div>
  );
}
