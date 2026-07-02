"use client";

import Link from "next/link";
import { Eye, Pencil } from "lucide-react";

import { CaseMobileCard } from "@/components/cases/case-mobile-card";
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
import { formatDefendantNames, formatPlaintiffNames } from "@/lib/case-parties";
import { cn, formatDate } from "@/lib/utils";
import type { CaseWithRelations } from "@/types/database";

interface CasesTableProps {
  cases: CaseWithRelations[];
  className?: string;
  canEdit?: boolean;
}

export function CasesTable({ cases, className, canEdit = false }: CasesTableProps) {
  if (cases.length === 0) {
    return (
      <div
        className={cn(
          "text-muted-foreground rounded-lg border border-dashed py-10 text-center text-sm",
          className
        )}
      >
        لا توجد قضايا لعرضها
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
            <TableHead>المدعي</TableHead>
            <TableHead>المدعى عليه</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>التكليف</TableHead>
            <TableHead className="w-20">إجراء</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map((caseItem) => (
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
              <TableCell className="font-medium">
                <Link
                  href={`/cases/${caseItem.id}`}
                  className="hover:text-primary hover:underline"
                >
                  {formatPlaintiffNames(caseItem.parties)}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDefendantNames(caseItem.parties)}
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
                  {canEdit && (
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
          ))}
        </TableBody>
      </Table>

      <div className="space-y-3 lg:hidden">
        {cases.map((caseItem) => (
          <CaseMobileCard
            key={caseItem.id}
            caseItem={caseItem}
            compact
            canEdit={canEdit}
          />
        ))}
      </div>
    </>
  );
}
