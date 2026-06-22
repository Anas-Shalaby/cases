"use client";

import { useState, type ReactNode } from "react";
import { Menu, Scale } from "lucide-react";

import { SidebarContent } from "@/components/layout/sidebar-content";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Profile } from "@/types/database";

interface MobileHeaderProps {
  profile: Profile | null;
  bellSlot?: ReactNode;
}

export function MobileHeader({ profile, bellSlot }: MobileHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="outline" size="icon-sm" aria-label="فتح القائمة" />
          }
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="right" className="w-72 max-w-[85vw] p-0" showCloseButton>
          <SheetTitle className="sr-only">قائمة التنقل</SheetTitle>
          <SidebarContent profile={profile} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Scale className="size-4" />
        </div>
        <span className="truncate text-sm font-bold">إدارة القضايا</span>
      </div>

      {bellSlot}
    </header>
  );
}
