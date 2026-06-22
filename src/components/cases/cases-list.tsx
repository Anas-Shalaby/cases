"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Briefcase, Search } from "lucide-react";

import { CaseMobileCard } from "@/components/cases/case-mobile-card";
import { CasesDataTable } from "@/components/cases/cases-data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CASE_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
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
      <Card className="hidden w-full overflow-hidden lg:block">
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
            canEdit={isCoordinator}
          />
        </CardContent>
      </Card>

      {/* بطاقات — موبايل */}
      <div className="space-y-3 lg:hidden">
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
            <CaseMobileCard key={caseItem.id} caseItem={caseItem} canEdit={isCoordinator} />
          ))
        )}
      </div>
    </div>
  );
}
