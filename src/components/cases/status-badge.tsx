import { Badge } from "@/components/ui/badge";
import { CASE_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CaseStatus } from "@/types/database";

const statusStyles: Record<CaseStatus, string> = {
  open: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  delayed:
    "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  closed:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

interface StatusBadgeProps {
  status: CaseStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", statusStyles[status], className)}
    >
      {CASE_STATUS_LABELS[status]}
    </Badge>
  );
}
