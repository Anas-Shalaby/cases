"use client";

import { useTransition, useState } from "react";
import {
  Bell,
  Briefcase,
  Calendar,
  FileText,
  Loader2,
  Trash2,
} from "lucide-react";

import {
  deleteNotification,
  markNotificationAsRead,
} from "@/lib/actions/notifications";
import {
  NOTIFICATION_TYPE_COLORS,
  NOTIFICATION_TYPE_LABELS,
} from "@/lib/notifications";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NavButton } from "@/components/ui/nav-button";
import type { NotificationType, NotificationWithCase } from "@/types/database";

const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
  report_deadline: FileText,
  meeting_reminder: Calendar,
  new_document: FileText,
  case_assigned: Briefcase,
};

type PendingAction = "read" | "delete" | "navigate" | null;

interface NotificationItemProps {
  notification: NotificationWithCase;
  compact?: boolean;
  onUpdate?: () => void;
}

export function NotificationItem({
  notification,
  compact = false,
  onUpdate,
}: NotificationItemProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const Icon = TYPE_ICONS[notification.type];
  const caseHref = `/cases/${notification.case_id}`;

  function handleMarkRead() {
    if (notification.is_read) return;
    setPendingAction("read");
    startTransition(async () => {
      await markNotificationAsRead(notification.id);
      onUpdate?.();
      setPendingAction(null);
    });
  }

  function handleDelete() {
    setPendingAction("delete");
    startTransition(async () => {
      await deleteNotification(notification.id);
      onUpdate?.();
      setPendingAction(null);
    });
  }

  return (
    <div
      className={cn(
        "group relative rounded-lg border p-4 transition-colors",
        !notification.is_read
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-background",
        isPending && "opacity-70"
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            NOTIFICATION_TYPE_COLORS[notification.type]
          )}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Icon className="size-4" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-0.5">
              <p className="font-medium leading-snug">{notification.title}</p>
              <span
                className={cn(
                  "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                  NOTIFICATION_TYPE_COLORS[notification.type]
                )}
              >
                {NOTIFICATION_TYPE_LABELS[notification.type]}
              </span>
            </div>
            <time
              className="text-muted-foreground shrink-0 text-xs"
              dateTime={notification.created_at}
            >
              {formatRelativeTime(notification.created_at)}
            </time>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed">
            {notification.message}
          </p>

          {notification.case && (
            <NavButton
              href={caseHref}
              variant="link"
              size="sm"
              className="h-auto px-0 text-sm font-medium"
              onNavigate={() => {
                if (!notification.is_read) handleMarkRead();
              }}
            >
              {notification.case.case_number} — {notification.case.case_name}
            </NavButton>
          )}

          {!compact && (
            <div className="flex flex-wrap gap-2 pt-2">
              {!notification.is_read && (
                <Button
                  variant="outline"
                  size="sm"
                  loading={pendingAction === "read"}
                  disabled={isPending && pendingAction !== "read"}
                  onClick={handleMarkRead}
                >
                  تعليم كمقروء
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                loading={pendingAction === "delete"}
                disabled={isPending && pendingAction !== "delete"}
                onClick={handleDelete}
              >
                <Trash2 className="size-3.5" />
                حذف
              </Button>
              <NavButton
                href={caseHref}
                variant="ghost"
                size="sm"
                onNavigate={() => {
                  if (!notification.is_read) handleMarkRead();
                }}
              >
                عرض القضية
              </NavButton>
            </div>
          )}
        </div>

        {!notification.is_read && (
          <span
            className="absolute top-4 left-4 size-2 rounded-full bg-primary"
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}
