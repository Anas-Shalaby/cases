import { ArrowLeft, AlertTriangle, Bell } from "lucide-react";

import { NavButton } from "@/components/ui/nav-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNotifications } from "@/lib/actions/notifications";

export async function CoordinatorAlertsBanner() {
  const notifications = await getNotifications(10, { syncDeadlines: false });
  const unread = notifications.filter((n) => !n.is_read);

  if (unread.length === 0) return null;

  const urgent = unread.filter(
    (n) => n.type === "report_deadline" || n.type === "meeting_reminder"
  );

  return (
    <Card className="border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-amber-900 dark:text-amber-200">
          <Bell className="size-4" />
          تنبيهات تحتاج انتباهك
          <span className="mr-auto rounded-full bg-amber-600 px-2 py-0.5 text-xs text-white">
            {unread.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {unread.slice(0, 3).map((n) => (
            <li
              key={n.id}
              className="flex items-start gap-2 text-sm text-amber-950 dark:text-amber-100"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span className="line-clamp-2">{n.title}</span>
            </li>
          ))}
        </ul>
        {urgent.length > 0 && (
          <p className="text-xs text-amber-800 dark:text-amber-300">
            {urgent.length} تنبيه{urgent.length === 1 ? "" : "ات"} عاجلة متعلقة
            بالمواعيد
          </p>
        )}
        <NavButton
          variant="outline"
          size="sm"
          className="border-amber-300 bg-background"
          href="/notifications"
        >
          <ArrowLeft className="size-4" />
          عرض كل التنبيهات
        </NavButton>
      </CardContent>
    </Card>
  );
}
