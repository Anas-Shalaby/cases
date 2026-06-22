import type { LogActionType } from "@/types/database";

export const LOG_ACTION_LABELS: Record<LogActionType, string> = {
  create_case: "إنشاء قضية",
  update_case: "تعديل قضية",
  delete_case: "حذف قضية",
  create_user: "إضافة عضو",
  upload_document: "رفع مستند",
};

export const LOG_ACTION_COLORS: Record<LogActionType, string> = {
  create_case:
    "text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300",
  update_case:
    "text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300",
  delete_case:
    "text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-300",
  create_user:
    "text-violet-700 bg-violet-50 dark:bg-violet-950 dark:text-violet-300",
  upload_document:
    "text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300",
};

export const LOG_ACTION_FILTERS: { value: "all" | LogActionType; label: string }[] =
  [
    { value: "all", label: "كل الأنشطة" },
    { value: "create_case", label: LOG_ACTION_LABELS.create_case },
    { value: "update_case", label: LOG_ACTION_LABELS.update_case },
    { value: "delete_case", label: LOG_ACTION_LABELS.delete_case },
    { value: "create_user", label: LOG_ACTION_LABELS.create_user },
    { value: "upload_document", label: LOG_ACTION_LABELS.upload_document },
  ];
