"use client";

import Link from "next/link";
import { Eye, Pencil } from "lucide-react";

import { CaseSituationCell } from "@/components/dashboard/case-situation-cell";
import { StatusBadge } from "@/components/cases/status-badge";
import { NavButton } from "@/components/ui/nav-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { canEditCaseSituation } from "@/lib/case-situation";
import { formatDefendantNames, formatPlaintiffNames } from "@/lib/case-parties";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import type { CaseWithRelations, UserRole } from "@/types/database";

interface CaseSituationsTableProps {
  cases: CaseWithRelations[];
  currentUserId: string;
  currentUserRole: UserRole;
  className?: string;
}

export function CaseSituationsTable({
  cases,
  currentUserId,
  currentUserRole,
  className,
}: CaseSituationsTableProps) {
  const canEditCases = currentUserRole === "coordinator";

  if (cases.length === 0) {
    return (
      <div
        className={cn(
          "text-muted-foreground rounded-lg border border-dashed py-10 text-center text-sm",
          className,
        )}
      >
        لا توجد قضايا نشطة لعرض موقفها
      </div>
    );
  }

  return (
    <>
      <Table className={cn("hidden lg:table", className)}>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>رقم القضية</TableHead>
            <TableHead>اسم القضية</TableHead>
            <TableHead>{USER_ROLE_LABELS.expert}</TableHead>
            <TableHead className="min-w-[240px]">موقف القضية</TableHead>

            <TableHead>الحالة</TableHead>
            <TableHead>التكليف</TableHead>
            <TableHead className="w-20">إجراء</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map((caseItem) => {
            const canEditSituation = canEditCaseSituation(currentUserRole);

            return (
              <TableRow key={caseItem.id}>
                <TableCell>
                  <Link
                    href={`/cases/${caseItem.id}`}
                    className="font-mono text-xs font-semibold text-primary hover:underline"
                    dir="ltr"
                  >
                    {caseItem.case_number}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[200px] truncate font-medium">
                  <Link
                    href={`/cases/${caseItem.id}`}
                    className="hover:text-primary hover:underline"
                  >
                    {caseItem.case_name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {caseItem.expert?.full_name ?? "—"}
                </TableCell>
                <TableCell className="align-top">
                  <CaseSituationCell
                    caseId={caseItem.id}
                    value={caseItem.situation}
                    canEdit={canEditSituation}
                  />
                </TableCell>

                <TableCell>
                  <StatusBadge status={caseItem.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(caseItem.assignment_date)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    <NavButton
                      href={`/cases/${caseItem.id}`}
                      variant="ghost"
                      size="icon-xs"
                    >
                      <Eye className="size-3.5" />
                    </NavButton>
                    {canEditCases && (
                      <NavButton
                        href={`/cases/${caseItem.id}/edit`}
                        variant="ghost"
                        size="icon-xs"
                      >
                        <Pencil className="size-3.5" />
                      </NavButton>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="space-y-3 lg:hidden">
        {cases.map((caseItem) => {
          const canEditSituation = canEditCaseSituation(currentUserRole);

          return (
            <div key={caseItem.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p
                    className="font-mono text-sm font-bold text-primary"
                    dir="ltr"
                  >
                    {caseItem.case_number}
                  </p>
                  <p className="font-medium leading-snug">
                    {caseItem.case_name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {USER_ROLE_LABELS.expert}:{" "}
                    {caseItem.expert?.full_name ?? "—"}
                  </p>
                </div>
                <StatusBadge status={caseItem.status} />
              </div>

              <div>
                <p className="text-muted-foreground mb-1 text-xs">
                  موقف القضية
                </p>
                <CaseSituationCell
                  caseId={caseItem.id}
                  value={caseItem.situation}
                  canEdit={canEditSituation}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="min-w-0">
                  <p className="text-muted-foreground mb-0.5 text-xs">المدعي</p>
                  <p className="truncate font-medium">
                    {formatPlaintiffNames(caseItem.parties)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-muted-foreground mb-0.5 text-xs">
                    المدعى عليه
                  </p>
                  <p className="truncate font-medium">
                    {formatDefendantNames(caseItem.parties)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <NavButton
                  href={`/cases/${caseItem.id}`}
                  variant="outline"
                  size="sm"
                  className={canEditCases ? "flex-1" : "w-full"}
                >
                  <Eye className="size-4" />
                  عرض
                </NavButton>
                {canEditCases && (
                  <NavButton
                    href={`/cases/${caseItem.id}/edit`}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Pencil className="size-4" />
                    تعديل
                  </NavButton>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
