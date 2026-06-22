"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

interface FloatingAddCaseButtonProps {
  isCoordinator?: boolean;
}

export function FloatingAddCaseButton({
  isCoordinator = false,
}: FloatingAddCaseButtonProps) {
  const pathname = usePathname();

  const hiddenRoutes = ["/cases/new"];
  const isHidden = hiddenRoutes.some((route) => pathname.startsWith(route));

  if (!isCoordinator || isHidden) return null;

  return (
    <Link
      href="/cases/new"
      className={cn(
        "fixed z-50 flex size-14 items-center justify-center rounded-full",
        "bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-[max(1.5rem,env(safe-area-inset-left))]",
        "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
        "transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50",
        "active:scale-95"
      )}
      aria-label="إضافة قضية جديدة"
      title="إضافة قضية جديدة"
    >
      <Plus className="size-7 stroke-[2.5]" />
    </Link>
  );
}
