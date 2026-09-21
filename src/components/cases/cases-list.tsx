"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, CalendarRange, Search, X } from "lucide-react";

import { CaseMobileCard } from "@/components/cases/case-mobile-card";
import { CasesDataTable } from "@/components/cases/cases-data-table";
import { ExportCasesButtons } from "@/components/cases/export-cases-buttons";
import { NewCaseButton } from "@/components/cases/new-case-button";
import { Button } from "@/components/ui/button";
import { NavButton } from "@/components/ui/nav-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CASE_STATUS_LABELS, USER_ROLE_LABELS } from "@/lib/constants";
import { caseMatchesPartySearch } from "@/lib/case-parties";
import { getCasesWithLateDeadlines, isCaseLate } from "@/lib/case-deadlines";
import { cn } from "@/lib/utils";
import type { CaseStatus, CaseWithRelations } from "@/types/database";

type StatusFilter = "all" | CaseStatus;

interface CasesListProps {
  cases: CaseWithRelations[];
  isCoordinator?: boolean;
  initialStatusFilter?: StatusFilter;
  expertId?: string;
  assistantId?: string;
  memberFilterName?: string;
  memberFilterRole?: "expert" | "assistant";
  enableExpertExport?: boolean;
  exportExpertName?: string;
}

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "open", label: CASE_STATUS_LABELS.open },
  { value: "delayed", label: "مواعيد متأخرة" },
  { value: "closed", label: CASE_STATUS_LABELS.closed },
];

export function CasesList({
  cases,
  isCoordinator,
  initialStatusFilter = "all",
  expertId,
  assistantId,
  memberFilterName,
  memberFilterRole,
  enableExpertExport = false,
  exportExpertName,
}: CasesListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>(initialStatusFilter);
  const [selectedExpertFilter, setSelectedExpertFilter] =
    useState<string>("all");
  // judgment date interval filter (maps to judges_meeting_date in DB)
  const [judgmentFrom, setJudgmentFrom] = useState("");
  const [judgmentTo, setJudgmentTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // local copy for optimistic inline edits (avoids full page reload lag)
  const [localCases, setLocalCases] = useState(cases);
  useEffect(() => {
    setLocalCases(cases);
  }, [cases]);

  const uniqueExperts = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    localCases.forEach((c) => {
      if (c.expert_id && c.expert) {
        map.set(c.expert_id, { id: c.expert_id, name: c.expert.full_name });
      }
    });
    return Array.from(map.values());
  }, [localCases]);

  const memberFilteredCases = useMemo(() => {
    if (expertId) {
      return localCases.filter((c) => c.expert_id === expertId);
    }
    if (assistantId) {
      return localCases.filter((c) => c.assistant_id === assistantId);
    }
    return localCases;
  }, [localCases, expertId, assistantId]);

  function handleSituationUpdated(caseId: string, newSituation: string | null) {
    setLocalCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, situation: newSituation } : c))
    );
  }

  // base filter: all filters EXCEPT status (so status counts stay in sync with judgment/search/expert)
  const baseFilteredCases = useMemo(() => {
    const query = search.trim().toLowerCase();
    return memberFilteredCases.filter((caseItem) => {
      const matchesExpert =
        selectedExpertFilter === "all" ||
        caseItem.expert_id === selectedExpertFilter;
      const matchesSearch =
        !query ||
        caseItem.case_number?.toLowerCase().includes(query) ||
        caseItem.case_name?.toLowerCase().includes(query) ||
        caseMatchesPartySearch(caseItem.parties, query) ||
        caseItem.coordinator?.full_name?.toLowerCase().includes(query) ||
        caseItem.expert?.full_name?.toLowerCase().includes(query) ||
        caseItem.assistant?.full_name?.toLowerCase().includes(query);

      const matchesJudgmentDate = (() => {
        if (!judgmentFrom && !judgmentTo) return true;
        const raw = caseItem.judges_meeting_date;
        if (!raw) return false;
        const dateOnly = raw.slice(0, 10);
        if (judgmentFrom && dateOnly < judgmentFrom) return false;
        if (judgmentTo && dateOnly > judgmentTo) return false;
        return true;
      })();

      return matchesSearch && matchesExpert && matchesJudgmentDate;
    });
  }, [
    memberFilteredCases,
    search,
    selectedExpertFilter,
    judgmentFrom,
    judgmentTo,
  ]);

  const filteredCases = useMemo(() => {
    return baseFilteredCases.filter((caseItem) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "delayed") return isCaseLate(caseItem);
      return caseItem.status === statusFilter;
    });
  }, [baseFilteredCases, statusFilter]);

  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCases.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCases, currentPage]);

  const totalPages = Math.ceil(filteredCases.length / ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, selectedExpertFilter, judgmentFrom, judgmentTo]);

  const counts = useMemo(
    () => ({
      all: baseFilteredCases.length,
      open: baseFilteredCases.filter((c) => c.status === "open").length,
      delayed: getCasesWithLateDeadlines(baseFilteredCases).length,
      closed: baseFilteredCases.filter((c) => c.status === "closed").length,
    }),
    [baseFilteredCases],
  );

  const selectedExpert = useMemo(
    () =>
      uniqueExperts.find((expert) => expert.id === selectedExpertFilter) ??
      null,
    [uniqueExperts, selectedExpertFilter],
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
          {isCoordinator && <NewCaseButton className="mt-6" />}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {memberFilterName && memberFilterRole && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              عرض قضايا{" "}
              <span className="font-semibold">
                {USER_ROLE_LABELS[memberFilterRole]}: {memberFilterName}
              </span>
              <span className="text-muted-foreground mr-2">
                ({memberFilteredCases.length} قضية)
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <NavButton variant="outline" size="sm" href="/cases">
                <X className="size-4" />
                إلغاء التصفية
              </NavButton>
              {memberFilterRole === "expert" && (
                <ExportCasesButtons
                  cases={filteredCases}
                  expertName={memberFilterName}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full flex-col gap-3 sm:max-w-md sm:flex-row">
              <div className="relative flex-1">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
                <Input
                  placeholder="بحث برقم القضية، الاسم، الأطراف..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-9"
                />
              </div>
              {!expertId && uniqueExperts.length > 0 && (
                <Select
                  value={selectedExpertFilter}
                  onValueChange={(val) => setSelectedExpertFilter(val || "all")}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    {selectedExpertFilter && selectedExpert ? (
                      `${selectedExpert.name} `
                    ) : (
                      <SelectValue placeholder="اختر الخبير" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">اختر الخبير</SelectItem>
                    {uniqueExperts.map((exp) => (
                      <SelectItem key={exp.id} value={exp.id}>
                        {exp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
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
                        : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {filter.label}
                    <span className="mr-1.5 opacity-70">
                      ({counts[filter.value]})
                    </span>
                  </button>
                ))}
              </div>
              {enableExpertExport && !expertId && filteredCases.length > 0 && (
                <ExportCasesButtons
                  cases={filteredCases}
                  expertName={exportExpertName}
                />
              )}
            </div>
          </div>

          {/* Judgment date interval filter (from / to) */}
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-end sm:gap-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CalendarRange className="size-4 text-muted-foreground" />
              <span>تصفية بتاريخ الجلسة</span>
              <span className="text-muted-foreground text-xs font-normal">
                (ميعاد الجلسة القادم)
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end sm:justify-end">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="judgment-from" className="text-xs">
                  من تاريخ
                </Label>
                <Input
                  id="judgment-from"
                  type="date"
                  value={judgmentFrom}
                  onChange={(e) => setJudgmentFrom(e.target.value)}
                  className="w-full sm:w-[170px]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="judgment-to" className="text-xs">
                  إلى تاريخ
                </Label>
                <Input
                  id="judgment-to"
                  type="date"
                  value={judgmentTo}
                  onChange={(e) => setJudgmentTo(e.target.value)}
                  className="w-full sm:w-[170px]"
                />
              </div>
              {(judgmentFrom || judgmentTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setJudgmentFrom("");
                    setJudgmentTo("");
                  }}
                  className="w-fit"
                >
                  <X className="size-4" />
                  مسح التصفية
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول shadcn — شاشات كبيرة */}
      <Card className="hidden w-full overflow-hidden lg:block">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between text-base">
            <span>قائمة القضايا</span>
            <span className="text-muted-foreground text-sm font-normal">
              {filteredCases.length} من {baseFilteredCases.length} قضية
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <CasesDataTable
            cases={paginatedCases}
            emptyMessage="لا توجد نتائج مطابقة للبحث"
            canEdit={isCoordinator}
            onSituationUpdated={handleSituationUpdated}
          />
        </CardContent>
      </Card>

      {/* بطاقات — موبايل */}
      <div className="space-y-3 lg:hidden">
        {paginatedCases.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                لا توجد نتائج مطابقة للبحث
              </p>
            </CardContent>
          </Card>
        ) : (
          paginatedCases.map((caseItem) => (
            <CaseMobileCard
              key={caseItem.id}
              caseItem={caseItem}
              canEdit={isCoordinator}
              onSituationUpdated={handleSituationUpdated}
            />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            السابق
          </Button>
          <span className="text-sm text-muted-foreground mx-2">
            صفحة {currentPage} من {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}
