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

export const NAV_ITEMS = [
  { href: "/", label: "لوحة التحكم", icon: "LayoutDashboard" as const },
  { href: "/cases", label: "القضايا", icon: "Briefcase" as const },
  { href: "/settings", label: "الإعدادات", icon: "Settings" as const },
] as const;
