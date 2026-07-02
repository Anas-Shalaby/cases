"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Bell, CheckCheck } from "lucide-react";

import { NotificationItem } from "@/components/notifications/notification-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { markAllNotificationsAsRead } from "@/lib/actions/notifications";
import type { NotificationWithCase } from "@/types/database";

interface NotificationsListProps {
  notifications: NotificationWithCase[];
}

export function NotificationsList({ notifications }: NotificationsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  function refresh() {
    router.refresh();
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsAsRead();
      refresh();
    });
  }

  if (notifications.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted">
            <Bell className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">لا توجد تنبيهات</h3>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            ستظهر هنا تنبيهات مواعيد التقارير والاجتماعات والمستندات الجديدة
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            لديك{" "}
            <span className="text-foreground font-semibold">{unreadCount}</span>{" "}
            تنبيه{unreadCount === 1 ? "" : "ات"} غير مقروءة
          </p>
          <Button
            variant="outline"
            size="sm"
            loading={isPending}
            onClick={handleMarkAllRead}
            className="w-full sm:w-auto"
          >
            <CheckCheck className="size-4" />
            تعليم الكل كمقروء
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onUpdate={refresh}
          />
        ))}
      </div>
    </div>
  );
}
