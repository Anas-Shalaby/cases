import { NotificationBellLoader } from "@/components/notifications/notification-bell-loader";

export function DesktopNotificationBar() {
  return (
    <div className="mb-4 hidden items-center justify-end lg:flex">
      <NotificationBellLoader />
    </div>
  );
}
