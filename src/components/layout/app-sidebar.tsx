import { SidebarContent } from "@/components/layout/sidebar-content";
import type { Profile } from "@/types/database";

interface AppSidebarProps {
  profile: Profile | null;
}

export function AppSidebar({ profile }: AppSidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-s lg:flex">
      <SidebarContent profile={profile} />
    </aside>
  );
}
