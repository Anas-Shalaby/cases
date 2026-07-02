import { ScheduleCalendar } from "@/components/schedule/schedule-calendar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { getMyAssignedTasks } from "@/lib/actions/case-tasks";
import { getCases } from "@/lib/actions/cases";
import {
  collectScheduleEvents,
  mergeScheduleEvents,
  parseMonthParam,
  tasksToScheduleEvents,
} from "@/lib/case-schedule";
import { getCurrentProfile } from "@/lib/actions/profile";
import { redirect } from "next/navigation";

interface SchedulePageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { month: monthParam } = await searchParams;
  const { year, month } = parseMonthParam(monthParam);

  const [cases, assignedTasks] = await Promise.all([
    getCases(),
    getMyAssignedTasks(),
  ]);

  const events = mergeScheduleEvents(
    collectScheduleEvents(cases, profile.id, profile.role),
    tasksToScheduleEvents(assignedTasks, profile.id)
  );

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="المواعيد"
        description="تقويم المواعيد والمهام — المطلوب إنجازه وما تم إنجازه"
      />

      <ScheduleCalendar year={year} month={month} events={events} />
    </div>
  );
}
