"use client";

import { usePathname } from "next/navigation";
import {
  Briefcase,
  Bell,
  Calendar,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  Scale,
  Settings,
  Users,
} from "lucide-react";

import { NavLink } from "@/components/ui/nav-button";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { logout } from "@/lib/actions/auth";
import { NAV_ITEMS, USER_ROLE_LABELS } from "@/lib/constants";
import { canAccessNotifications } from "@/lib/notifications-access";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";

const iconMap = {
  LayoutDashboard,
  Calendar,
  ListChecks,
  Briefcase,
  Bell,
  FileBarChart,
  Users,
  ClipboardList,
  Mail,
  Settings,
} as const;

interface SidebarContentProps {
  profile: Profile | null;
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function SidebarContent({
  profile,
  onNavigate,
  collapsed = false,
  onToggle,
}: SidebarContentProps) {
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
      <div
        className={cn(
          "flex items-center gap-3 py-5",
          collapsed ? "justify-center px-2" : "px-4 justify-between"
        )}
      >
        <div className={cn("flex items-center gap-3 min-w-0", collapsed && "justify-center")}>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scale className="size-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold leading-tight">إدارة القضايا</h1>
              <p className="text-xs text-muted-foreground">لوحة التحكم</p>
            </div>
          )}
        </div>
        {onToggle && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={collapsed ? "توسيع الشريط الجانبي" : "تصغير الشريط الجانبي"}
            onClick={onToggle}
            className={cn("shrink-0 hidden lg:inline-flex", collapsed && "hidden lg:hidden")}
            title={collapsed ? "توسيع" : "تصغير"}
          >
            <PanelLeftClose className="size-4" />
          </Button>
        )}
      </div>

      {/* Collapsed: toggle button centered below logo */}
      {collapsed && onToggle && (
        <div className="flex justify-center pb-2">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="توسيع الشريط الجانبي"
            onClick={onToggle}
            title="توسيع"
          >
            <PanelLeftOpen className="size-4" />
          </Button>
        </div>
      )}

      <Separator />

      <nav className={cn("flex-1 space-y-1 overflow-y-auto py-4", collapsed ? "px-1.5" : "px-3")}>
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
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-colors",
                collapsed
                  ? "justify-center px-2 py-2.5"
                  : "gap-3 px-3 py-2.5",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className={cn("border-t", collapsed ? "p-2" : "p-4")}>
        {profile && !collapsed && (
          <div className="mb-3 px-2">
            <p className="truncate text-sm font-medium">{profile.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {USER_ROLE_LABELS[profile.role]}
            </p>
          </div>
        )}
        {profile && collapsed && (
          <div className="mb-2 flex justify-center" title={`${profile.full_name} — ${USER_ROLE_LABELS[profile.role]}`}>
            <div className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold">
              {profile.full_name.trim().charAt(0) || "?"}
            </div>
          </div>
        )}
        <form action={logout}>
          {collapsed ? (
            <Button
              type="submit"
              variant="ghost"
              size="icon-sm"
              className="w-full"
              title="تسجيل الخروج"
              aria-label="تسجيل الخروج"
            >
              <LogOut className="size-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start gap-2"
            >
              <LogOut className="size-4" />
              تسجيل الخروج
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
