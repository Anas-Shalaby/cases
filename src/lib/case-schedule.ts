import {
  collectCaseDeadlines,
  DEADLINE_LABELS,
  type CaseDeadline,
  type DeadlineType,
} from "@/lib/case-deadlines";
import { CASE_MILESTONES, type CaseMilestoneKey } from "@/lib/case-milestones";
import { USER_ROLE_LABELS } from "@/lib/constants";
import type { CaseTaskWithRelations, CaseWithRelations, UserRole } from "@/types/database";

export type ScheduleEventStatus = "pending" | "completed";

export interface ScheduleEvent {
  caseId: string;
  caseNumber: string;
  caseName: string;
  date: string;
  label: string;
  status: ScheduleEventStatus;
  deadlineType?: DeadlineType;
  milestoneKey?: CaseMilestoneKey;
  daysUntil?: number;
  isPastDue?: boolean;
  userRole: UserRole;
  userRoleLabel: string;
}

export const ARABIC_WEEKDAYS = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
] as const;

export const ARABIC_WEEKDAYS_SHORT = [
  "أحد",
  "إثن",
  "ثلا",
  "أرب",
  "خمي",
  "جمع",
  "سبت",
] as const;

function toDateString(value: string): string {
  return value.slice(0, 10);
}

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getUserRoleOnCase(
  caseItem: CaseWithRelations,
  userId: string,
  profileRole: UserRole
): UserRole | null {
  if (caseItem.coordinator_id === userId) return "coordinator";
  if (caseItem.expert_id === userId) return "expert";
  if (caseItem.assistant_id === userId) return "assistant";
  if (profileRole === "coordinator") return "coordinator";
  return null;
}

function deadlineToEvent(
  deadline: CaseDeadline,
  userRole: UserRole
): ScheduleEvent {
  return {
    caseId: deadline.caseId,
    caseNumber: deadline.caseNumber,
    caseName: deadline.caseName,
    date: deadline.deadlineDate,
    label: deadline.label,
    status: "pending",
    deadlineType: deadline.deadlineType,
    daysUntil: deadline.daysUntil,
    isPastDue: deadline.isPastDue,
    userRole,
    userRoleLabel: USER_ROLE_LABELS[userRole],
  };
}

export function collectScheduleEvents(
  cases: CaseWithRelations[],
  userId: string,
  profileRole: UserRole
): ScheduleEvent[] {
  const events: ScheduleEvent[] = [];
  const activeCases = cases.filter((c) => c.status !== "closed");

  for (const caseItem of activeCases) {
    const userRole = getUserRoleOnCase(caseItem, userId, profileRole);
    if (!userRole) continue;

    for (const deadline of collectCaseDeadlines([caseItem])) {
      events.push(deadlineToEvent(deadline, userRole));
    }
  }

  for (const caseItem of cases) {
    const userRole = getUserRoleOnCase(caseItem, userId, profileRole);
    if (!userRole) continue;

    for (const milestone of CASE_MILESTONES) {
      const value = caseItem[milestone.key];
      if (!value) continue;

      events.push({
        caseId: caseItem.id,
        caseNumber: caseItem.case_number,
        caseName: caseItem.case_name,
        date: toDateString(value),
        label: milestone.label,
        status: "completed",
        milestoneKey: milestone.key,
        userRole,
        userRoleLabel: USER_ROLE_LABELS[userRole],
      });
    }
  }

  return events.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
    return a.caseName.localeCompare(b.caseName, "ar");
  });
}

export function getTodayDateString(): string {
  return localDateString(new Date());
}

export function getWeekStartDate(anchor = new Date()): Date {
  const date = new Date(anchor);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  return date;
}

export function getWeekDates(anchor = new Date()): string[] {
  const start = getWeekStartDate(anchor);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return localDateString(date);
  });
}

export interface WeekDaySchedule {
  date: string;
  weekdayIndex: number;
  weekdayName: string;
  weekdayShort: string;
  isToday: boolean;
  events: ScheduleEvent[];
}

export function groupEventsByWeek(
  events: ScheduleEvent[],
  anchor = new Date()
): WeekDaySchedule[] {
  const today = getTodayDateString();
  const weekDates = getWeekDates(anchor);

  return weekDates.map((date, weekdayIndex) => ({
    date,
    weekdayIndex,
    weekdayName: ARABIC_WEEKDAYS[weekdayIndex],
    weekdayShort: ARABIC_WEEKDAYS_SHORT[weekdayIndex],
    isToday: date === today,
    events: events.filter((event) => event.date === date),
  }));
}

export function getMonthBounds(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startPad = firstDay.getDay();
  const totalDays = lastDay.getDate();

  return { firstDay, lastDay, startPad, totalDays };
}

export interface MonthCalendarCell {
  date: string;
  dayNumber: number;
  inMonth: boolean;
  isToday: boolean;
  events: ScheduleEvent[];
}

export function buildMonthCalendar(
  year: number,
  month: number,
  events: ScheduleEvent[]
): MonthCalendarCell[] {
  const today = getTodayDateString();
  const { startPad, totalDays } = getMonthBounds(year, month);
  const cells: MonthCalendarCell[] = [];

  const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
  for (let i = startPad - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const date = new Date(year, month - 2, day);
    const dateStr = localDateString(date);
    cells.push({
      date: dateStr,
      dayNumber: day,
      inMonth: false,
      isToday: dateStr === today,
      events: events.filter((event) => event.date === dateStr),
    });
  }

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = localDateString(date);
    cells.push({
      date: dateStr,
      dayNumber: day,
      inMonth: true,
      isToday: dateStr === today,
      events: events.filter((event) => event.date === dateStr),
    });
  }

  const trailing = (7 - (cells.length % 7)) % 7;
  for (let day = 1; day <= trailing; day++) {
    const date = new Date(year, month, day);
    const dateStr = localDateString(date);
    cells.push({
      date: dateStr,
      dayNumber: day,
      inMonth: false,
      isToday: dateStr === today,
      events: events.filter((event) => event.date === dateStr),
    });
  }

  return cells;
}

export function formatMonthYear(year: number, month: number): string {
  return new Intl.DateTimeFormat("ar-SA", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export function parseMonthParam(value: string | undefined): {
  year: number;
  month: number;
} {
  const now = new Date();
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }

  const [year, month] = value.split("-").map(Number);
  if (month < 1 || month > 12) {
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }

  return { year, month };
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number
): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function monthParam(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function daysBetween(from: string, to: string): number {
  const fromMs = new Date(from).setHours(0, 0, 0, 0);
  const toMs = new Date(to).setHours(0, 0, 0, 0);
  return Math.round((toMs - fromMs) / (1000 * 60 * 60 * 24));
}

export function tasksToScheduleEvents(
  tasks: CaseTaskWithRelations[],
  userId: string
): ScheduleEvent[] {
  const today = getTodayDateString();
  const events: ScheduleEvent[] = [];

  for (const task of tasks) {
    if (task.assigned_to !== userId || !task.case) continue;

    const userRole = task.assignee?.role ?? "expert";

    if (task.status === "pending") {
      const daysUntil = daysBetween(today, task.due_date);
      events.push({
        caseId: task.case_id,
        caseNumber: task.case.case_number,
        caseName: task.case.case_name,
        date: task.due_date,
        label: `مهمة: ${task.title}`,
        status: "pending",
        daysUntil,
        isPastDue: daysUntil < 0,
        userRole,
        userRoleLabel: USER_ROLE_LABELS[userRole],
      });
      continue;
    }

    if (task.status === "completed" && task.completed_at) {
      events.push({
        caseId: task.case_id,
        caseNumber: task.case.case_number,
        caseName: task.case.case_name,
        date: toDateString(task.completed_at),
        label: `مهمة: ${task.title}`,
        status: "completed",
        userRole,
        userRoleLabel: USER_ROLE_LABELS[userRole],
      });
    }
  }

  return events;
}

export function mergeScheduleEvents(
  ...groups: ScheduleEvent[][]
): ScheduleEvent[] {
  return groups.flat().sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
    return a.caseName.localeCompare(b.caseName, "ar");
  });
}
