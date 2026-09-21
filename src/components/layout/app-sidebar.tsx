"use client";

import { useEffect, useState } from "react";

import { SidebarContent } from "@/components/layout/sidebar-content";
import type { Profile } from "@/types/database";

interface AppSidebarProps {
  profile: Profile | null;
}

export function AppSidebar({ profile }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem("sidebar-collapsed", String(collapsed));
    }
  }, [collapsed, hydrated]);

  // Avoid hydration mismatch flash: render expanded until hydrated, then transition
  const widthClass = !hydrated ? "w-64" : collapsed ? "w-[60px]" : "w-64";

  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 border-s lg:flex flex-col transition-all duration-300 ease-in-out ${widthClass}`}
    >
      <SidebarContent
        profile={profile}
        collapsed={hydrated ? collapsed : false}
        onToggle={() => setCollapsed((v) => !v)}
      />
    </aside>
  );
}
