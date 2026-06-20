"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Briefcase, Eye, Pencil, Search } from "lucide-react";

import { CasesDataTable } from "@/components/cases/cases-data-table";
import { StatusBadge } from "@/components/cases/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CASE_STATUS_LABELS, USER_ROLE_LABELS } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import type { CaseStatus, CaseWithRelations } from "@/types/database";

type StatusFilter = "all" | CaseStatus;

interface CasesListProps {
  cases: CaseWithRelations[];
  isCoordinator?: boolean;
}

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "open", label: CASE_STATUS_LABELS.open },
  { value: "delayed", label: CASE_STATUS_LABELS.delayed },
  { value: "closed", label: CASE_STATUS_LABELS.closed },
];

export function CasesList({ cases, isCoordinator }: CasesListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredCases = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cases.filter((caseItem) => {
      const matchesStatus =
        statusFilter === "all" || caseItem.status === statusFilter;
      const matchesSearch =
        !query ||
        caseItem.case_number?.toLowerCase().includes(query) ||
        caseItem.case_name?.toLowerCase().includes(query) ||
        caseItem.plaintiff_name.toLowerCase().includes(query) ||
        caseItem.defendant_name.toLowerCase().includes(query) ||
        caseItem.plaintiff_phone?.toLowerCase().includes(query) ||
        caseItem.defendant_phone?.toLowerCase().includes(query) ||
        caseItem.coordinator?.full_name?.toLowerCase().includes(query) ||
        caseItem.expert?.full_name?.toLowerCase().includes(query) ||
        caseItem.assistant?.full_name?.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [cases, search, statusFilter]);

  const counts = useMemo(
    () => ({
      all: cases.length,
      open: cases.filter((c) => c.status === "open").length,
      delayed: cases.filter((c) => c.status === "delayed").length,
      closed: cases.filter((c) => c.status === "closed").length,
    }),
    [cases]
  );

  if (cases.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted">
            <Briefcase className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">لا توجد قضايا بعد</h3>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            ابدأ بإضافة أول قضية لتتبع الأطراف والمواعيد وفريق العمل
          </p>
          {isCoordinator && (
            <Button className="mt-6" render={<Link href="/cases/new" />}>
              إضافة قضية جديدة
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="بحث برقم القضية، الاسم، الأطراف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  statusFilter === filter.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {filter.label}
                <span className="mr-1.5 opacity-70">
                  ({counts[filter.value]})
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* جدول shadcn — شاشات كبيرة */}
      <Card className="hidden w-full overflow-hidden md:block">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between text-base">
            <span>قائمة القضايا</span>
            <span className="text-muted-foreground text-sm font-normal">
              {filteredCases.length} من {cases.length} قضية
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <CasesDataTable
            cases={filteredCases}
            emptyMessage="لا توجد نتائج مطابقة للبحث"
          />
        </CardContent>
      </Card>

      {/* بطاقات — موبايل */}
      <div className="space-y-3 md:hidden">
        {filteredCases.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                لا توجد نتائج مطابقة للبحث
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCases.map((caseItem) => (
            <CaseMobileCard key={caseItem.id} caseItem={caseItem} />
          ))
        )}
      </div>
    </div>
  );
}

function CaseMobileCard({ caseItem }: { caseItem: CaseWithRelations }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p
              className="font-mono text-sm font-bold text-primary"
              dir="ltr"
            >
              {caseItem.case_number}
            </p>
            <p className="font-medium leading-snug">{caseItem.case_name}</p>
            <p className="text-muted-foreground text-xs">
              {formatDate(caseItem.assignment_date)}
            </p>
          </div>
          <StatusBadge status={caseItem.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground mb-0.5 text-xs">المدعي</p>
            <p className="font-medium">{caseItem.plaintiff_name}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5 text-xs">المدعى عليه</p>
            <p className="font-medium">{caseItem.defendant_name}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5 text-xs">الاجتماع</p>
            <p>{formatDate(caseItem.meeting_date)}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5 text-xs">التقرير النهائي</p>
            <p>{formatDate(caseItem.final_report_date)}</p>
          </div>
        </div>

        <div className="text-muted-foreground grid grid-cols-3 gap-2 border-t pt-3 text-xs">
          <div>
            <p className="mb-0.5">{USER_ROLE_LABELS.coordinator}</p>
            <p className="text-foreground truncate">
              {caseItem.coordinator?.full_name ?? "—"}
            </p>
          </div>
          <div>
            <p className="mb-0.5">{USER_ROLE_LABELS.expert}</p>
            <p className="text-foreground truncate">
              {caseItem.expert?.full_name ?? "—"}
            </p>
          </div>
          <div>
            <p className="mb-0.5">{USER_ROLE_LABELS.assistant}</p>
            <p className="text-foreground truncate">
              {caseItem.assistant?.full_name ?? "—"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            render={<Link href={`/cases/${caseItem.id}`} />}
          >
            <Eye className="size-4" />
            عرض
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            render={<Link href={`/cases/${caseItem.id}/edit`} />}
          >
            <Pencil className="size-4" />
            تعديل
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
