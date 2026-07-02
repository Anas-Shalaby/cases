"use client";

import { usePathname } from "next/navigation";
import {
  Briefcase,
  Bell,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  Scale,
  Settings,
  Users,
} from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { NavLink } from "@/components/ui/nav-button";
import { Separator } from "@/components/ui/separator";
import { logout } from "@/lib/actions/auth";
import { NAV_ITEMS, USER_ROLE_LABELS } from "@/lib/constants";
import { canAccessNotifications } from "@/lib/notifications-access";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";

const iconMap = {
  LayoutDashboard,
  Briefcase,
  Bell,
  FileBarChart,
  Users,
  ClipboardList,
  Settings,
} as const;

interface SidebarContentProps {
  profile: Profile | null;
  onNavigate?: () => void;
}

export function SidebarContent({ profile, onNavigate }: SidebarContentProps) {
  const pathname = usePathname();
  const isCoordinator = profile?.role === "coordinator";
  const hasNotifications = canAccessNotifications(profile?.role);

  const navItems = NAV_ITEMS.filter((item) => {
    if ("coordinatorOnly" in item && item.coordinatorOnly) {
      return isCoordinator;
    }
    if ("notificationAccess" in item && item.notificationAccess) {
      return hasNotifications;
    }
    return true;
  });

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Scale className="size-5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold leading-tight">إدارة القضايا</h1>
          <p className="text-xs text-muted-foreground">لوحة التحكم</p>
        </div>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <NavLink
              key={item.href}
              href={item.href}
              active={isActive}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t p-4">
        {profile && (
          <div className="mb-3 px-2">
            <p className="truncate text-sm font-medium">{profile.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {USER_ROLE_LABELS[profile.role]}
            </p>
          </div>
        )}
        <form action={logout}>
          <LogoutButton />
        </form>
      </div>
    </div>
  );
}
