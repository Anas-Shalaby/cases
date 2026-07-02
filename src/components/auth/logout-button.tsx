"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="ghost"
      className="w-full justify-start gap-2"
      loading={pending}
    >
      <LogOut className="size-4" />
      تسجيل الخروج
    </Button>
  );
}
