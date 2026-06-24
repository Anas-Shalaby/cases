import type { CaseStatus, UserRole } from "@/types/database";

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  open: "مفتوحة",
  delayed: "متأخرة",
  closed: "مغلقة",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  coordinator: "منسق",
  expert: "خبير",
  assistant: "مساعد",
};

/** تسميات العرض في صفحة إدارة الفريق */
export const TEAM_MEMBER_ROLE_LABELS: Record<
  "coordinator" | "expert" | "assistant",
  string
> = {
  coordinator: "منسق",
  expert: "خبير",
  assistant: "مساعد خبير",
};

export const NAV_ITEMS = [
  { href: "/", label: "لوحة التحكم", icon: "LayoutDashboard" as const },
  { href: "/cases", label: "القضايا", icon: "Briefcase" as const },
  {
    href: "/notifications",
    label: "التنبيهات",
    icon: "Bell" as const,
    notificationAccess: true,
  },
  {
    href: "/reports",
    label: "التقارير الشهرية",
    icon: "FileBarChart" as const,
  },
  {
    href: "/users",
    label: "أعضاء الفريق",
    icon: "Users" as const,
    coordinatorOnly: true,
  },
  {
    href: "/activity-logs",
    label: "سجل الأنشطة",
    icon: "ClipboardList" as const,
    coordinatorOnly: true,
  },
  { href: "/settings", label: "الإعدادات", icon: "Settings" as const },
] as const;
