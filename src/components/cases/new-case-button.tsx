"use client";

import { Plus } from "lucide-react";

import { NavButton } from "@/components/ui/nav-button";

interface NewCaseButtonProps {
  className?: string;
  size?: "default" | "sm" | "lg";
}

export function NewCaseButton({ className, size }: NewCaseButtonProps) {
  return (
    <NavButton href="/cases/new" className={className} size={size}>
      <Plus className="size-4" />
      قضية جديدة
    </NavButton>
  );
}
