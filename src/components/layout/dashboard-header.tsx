import { NewCaseButton } from "@/components/cases/new-case-button";

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
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm sm:line-clamp-none">
            {description}
          </p>
        )}
      </div>
      {showNewCase && (
        <NewCaseButton className="w-full shrink-0 sm:w-auto" />
      )}
    </div>
  );
}
