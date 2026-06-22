import { AppSidebar } from "@/components/layout/app-sidebar";
import { DesktopNotificationBar } from "@/components/layout/desktop-notification-bar";
import { FloatingAddCaseButton } from "@/components/layout/floating-add-case-button";
import { MobileHeader } from "@/components/layout/mobile-header";
import { NotificationBellLoader } from "@/components/notifications/notification-bell-loader";
import { getCurrentProfile } from "@/lib/actions/profile";
import { canAccessNotifications } from "@/lib/notifications-access";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  const isCoordinator = profile?.role === "coordinator";
  const hasNotifications = canAccessNotifications(profile?.role);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AppSidebar profile={profile} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <MobileHeader
          profile={profile}
          bellSlot={hasNotifications ? <NotificationBellLoader /> : null}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="mx-auto w-full max-w-[1800px] p-4 pb-24 sm:p-6 lg:p-8 lg:pb-28">
            {hasNotifications && <DesktopNotificationBar />}
            {children}
          </div>
        </main>
      </div>
      <FloatingAddCaseButton isCoordinator={isCoordinator} />
    </div>
  );
}
