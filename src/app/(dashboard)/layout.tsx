import { AppSidebar } from "@/components/layout/app-sidebar";
import { FloatingAddCaseButton } from "@/components/layout/floating-add-case-button";
import { getCurrentProfile } from "@/lib/actions/profile";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  const isCoordinator = profile?.role === "coordinator";

  return (
    <div className="flex min-h-screen">
      <AppSidebar profile={profile} />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-[1800px] p-4 pb-24 sm:p-6 lg:p-8 lg:pb-28">
          {children}
        </div>
      </main>
      <FloatingAddCaseButton isCoordinator={isCoordinator} />
    </div>
  );
}
