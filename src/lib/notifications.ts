import type { NotificationType } from "@/types/database";

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  report_deadline: "موعد تقرير",
  meeting_reminder: "تذكير اجتماع",
  new_document: "مستند جديد",
  case_assigned: "إسناد قضية",
};

export const NOTIFICATION_TYPE_COLORS: Record<NotificationType, string> = {
  report_deadline:
    "text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300",
  meeting_reminder:
    "text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300",
  new_document:
    "text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300",
  case_assigned:
    "text-indigo-700 bg-indigo-50 dark:bg-indigo-950 dark:text-indigo-300",
};
