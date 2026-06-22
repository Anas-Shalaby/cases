import { AlertTriangle, Briefcase, CheckCircle2, FolderOpen } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CaseStatsCardsProps {
  stats: {
    total: number;
    open: number;
    delayed: number;
    closed: number;
  };
}

const cards = [
  {
    key: "total" as const,
    label: "إجمالي القضايا",
    icon: Briefcase,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400",
  },
  {
    key: "open" as const,
    label: "قضايا مفتوحة",
    icon: FolderOpen,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400",
  },
  {
    key: "delayed" as const,
    label: "قضايا متأخرة",
    icon: AlertTriangle,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400",
  },
  {
    key: "closed" as const,
    label: "قضايا مغلقة",
    icon: CheckCircle2,
    color: "text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-400",
  },
];

export function CaseStatsCards({ stats }: CaseStatsCardsProps) {
  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ key, label, icon: Icon, color }) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <div className={`rounded-lg p-2 ${color}`}>
              <Icon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats[key]}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
