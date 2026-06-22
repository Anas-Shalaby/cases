"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Bell } from "lucide-react";

import { NotificationItem } from "@/components/notifications/notification-item";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { markAllNotificationsAsRead } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";
import type { NotificationWithCase } from "@/types/database";

interface NotificationBellProps {
  notifications: NotificationWithCase[];
  unreadCount: number;
}

export function NotificationBell({
  notifications,
  unreadCount,
}: NotificationBellProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const recent = notifications.slice(0, 5);

  function refresh() {
    router.refresh();
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsAsRead();
      refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            className="relative shrink-0"
            aria-label="التنبيهات"
          />
        }
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -top-1 -left-1 flex min-w-5 items-center justify-center",
              "rounded-full bg-destructive px-1 text-[10px] font-bold text-white"
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="bottom"
        className="w-[min(100vw-2rem,24rem)] p-0"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">التنبيهات</h2>
          {unreadCount > 0 && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleMarkAllRead}
              className="text-primary text-xs font-medium hover:underline disabled:opacity-50"
            >
              تعليم الكل كمقروء
            </button>
          )}
        </div>

        <div className="max-h-[min(70vh,24rem)] overflow-y-auto p-2">
          {recent.length === 0 ? (
            <p className="text-muted-foreground px-2 py-8 text-center text-sm">
              لا توجد تنبيهات جديدة
            </p>
          ) : (
            <div className="space-y-2">
              {recent.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  compact
                  onUpdate={refresh}
                />
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            render={<Link href="/notifications" />}
          >
            عرض كل التنبيهات
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
