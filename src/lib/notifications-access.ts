import type { UserRole } from "@/types/database";

export const NOTIFICATION_ROLES: UserRole[] = [
  "coordinator",
  "expert",
  "assistant",
];

export function canAccessNotifications(role: UserRole | undefined): boolean {
  return !!role && NOTIFICATION_ROLES.includes(role);
}
