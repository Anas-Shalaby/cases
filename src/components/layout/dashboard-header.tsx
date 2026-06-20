import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  showNewCase?: boolean;
}

export function DashboardHeader({
  title,
  description,
  showNewCase = false,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        )}
      </div>
      {showNewCase && (
        <Button render={<Link href="/cases/new" />}>
          <Plus className="size-4" />
          قضية جديدة
        </Button>
      )}
    </div>
  );
}
