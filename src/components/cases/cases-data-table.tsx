"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, MoreHorizontal, Pencil } from "lucide-react";

import { StatusBadge } from "@/components/cases/status-badge";
import { TeamMemberCasesLink } from "@/components/cases/team-member-cases-link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { COURT_LABELS, USER_ROLE_LABELS } from "@/lib/constants";
import { formatContactList, sanitizeContactList } from "@/lib/case-contacts";
import { getPartiesByType } from "@/lib/case-parties";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import type { CasePartyType, CaseWithRelations } from "@/types/database";

interface CasesDataTableProps {
  cases: CaseWithRelations[];
  className?: string;
  emptyMessage?: string;
  canEdit?: boolean;
}

function CellText({
  value,
  muted,
  dir,
}: {
  value: string | null | undefined;
  muted?: boolean;
  dir?: "ltr" | "rtl";
}) {
  const display = value?.trim() || "—";
  return (
    <span
      className={cn("text-sm", muted && "text-muted-foreground")}
      dir={dir}
    >
      {display}
    </span>
  );
}

function PartiesCell({
  parties,
  partyType,
}: {
  parties: CaseWithRelations["parties"];
  partyType: CasePartyType;
}) {
  const items = getPartiesByType(parties, partyType);
  if (items.length === 0) {
    return <CellText value="—" muted />;
  }

  const contactParty = items.find(
    (party) =>
      sanitizeContactList(party.phones).length > 0 ||
      sanitizeContactList(party.emails).length > 0
  );
  const contactText = contactParty
    ? [
        formatContactList(contactParty.phones),
        formatContactList(contactParty.emails),
      ]
        .filter(Boolean)
        .join(" • ")
    : null;

  const getPartyColor = (type: CasePartyType, index: number) => {
    if (type === "plaintiff") {
      const colors = [
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
        "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
        "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
        "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
        "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 dark:border-fuchsia-800",
      ];
      return colors[index % colors.length];
    } else {
      const colors = [
        "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
        "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
        "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800",
        "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
      ];
      return colors[index % colors.length];
    }
  };

  const typeLabel = partyType === "plaintiff" ? "المدعي" : "المدعي عليه";
  const getIndexLabel = (index: number) => {
    if (items.length === 1) return typeLabel;
    const ordinals = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر"];
    return `${typeLabel} ${ordinals[index] ?? (index + 1)}`;
  };

  return (
    <div className="min-w-[180px] space-y-1.5">
      <div className="flex flex-col gap-1.5">
        {items.map((party, index) => (
          <div
            key={party.id || index}
            className={cn(
              "rounded-md border px-2 py-1 text-xs font-medium leading-snug w-fit max-w-full break-words",
              getPartyColor(partyType, index)
            )}
            title={getIndexLabel(index)}
          >
            <span className="opacity-70 text-[10px] ml-1.5">{getIndexLabel(index)}:</span>
            {party.name}
          </div>
        ))}
      </div>
      {contactText && (
        <p className="text-muted-foreground text-xs leading-snug mt-1" dir="ltr">
          {contactText}
        </p>
      )}
    </div>
  );
}

export function CasesDataTable({
  cases,
  className,
  emptyMessage = "لا توجد قضايا لعرضها",
  canEdit = false,
}: CasesDataTableProps) {
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();
  const [navigatingCaseId, setNavigatingCaseId] = useState<string | null>(null);

  function navigateTo(href: string, caseId: string) {
    setNavigatingCaseId(caseId);
    startNavigation(() => {
      router.push(href);
    });
  }

  if (cases.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-16 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <Table className={cn("min-w-full lg:min-w-[1000px] xl:min-w-[1200px] w-full table-fixed", className)}>
      <TableHeader>
        <TableRow className="bg-muted/50 hover:bg-muted/50">
          <TableHead className="sticky right-0 z-10 w-[130px] bg-muted/80 backdrop-blur-sm">
            رقم القضية
          </TableHead>
          <TableHead className="w-[180px] lg:w-[220px]">اسم القضية</TableHead>
          <TableHead className="w-[140px] lg:table-cell">{USER_ROLE_LABELS.expert}</TableHead>
          <TableHead className="w-[180px]">موقف القضية</TableHead>
          <TableHead className="w-[110px]">الحالة</TableHead>
          <TableHead className="w-[130px] hidden xl:table-cell">تاريخ التكليف</TableHead>
          <TableHead className="w-[130px]">تاريخ الاجتماع</TableHead>
          <TableHead className="w-[130px] hidden 2xl:table-cell">التقرير الأولي</TableHead>
          <TableHead className="w-[130px] hidden 2xl:table-cell">التقرير النهائي</TableHead>
          <TableHead className="w-[140px] hidden 2xl:table-cell">{USER_ROLE_LABELS.coordinator}</TableHead>
          <TableHead className="w-[140px] hidden xl:table-cell">{USER_ROLE_LABELS.assistant}</TableHead>
          <TableHead className="sticky left-0 z-10 w-[80px] bg-muted/80 backdrop-blur-sm">
            إجراءات
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cases.map((caseItem) => (
          <TableRow
            key={caseItem.id}
            className={cn(
              "group",
              isNavigating && navigatingCaseId === caseItem.id && "opacity-70"
            )}
          >
            <TableCell className="sticky right-0 z-10 bg-card group-hover:bg-muted/50 align-top">
              <Link
                href={`/cases/${caseItem.id}`}
                className="font-mono text-xs font-bold text-primary hover:underline"
                dir="ltr"
              >
                {caseItem.case_number}
              </Link>
            </TableCell>

            <TableCell className="align-top">
              <Link
                href={`/cases/${caseItem.id}`}
                className="line-clamp-2 font-medium leading-snug hover:text-primary hover:underline"
              >
                {caseItem.case_name}
                {caseItem.case_type === "committee" && (
                  <span className="mr-1 inline-block rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                    لجنة
                  </span>
                )}
                {caseItem.court && (
                  <span className="mr-1 inline-block rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {COURT_LABELS[caseItem.court]}
                  </span>
                )}
              </Link>
            </TableCell>

            <TableCell className="align-top lg:table-cell">
              <TeamMemberCasesLink
                memberId={caseItem.expert_id}
                memberName={caseItem.expert?.full_name}
                role="expert"
                muted
              />
            </TableCell>

            <TableCell className="align-top">
              <span className="line-clamp-2 text-sm text-muted-foreground whitespace-pre-wrap">{caseItem.situation || "—"}</span>
            </TableCell>

            <TableCell className="align-top">
              <StatusBadge status={caseItem.status} />
            </TableCell>

            <TableCell className="align-top hidden xl:table-cell">
              <CellText value={formatDate(caseItem.assignment_date)} muted />
            </TableCell>

            <TableCell className="align-top">
              <CellText value={formatDateTime(caseItem.meeting_date)} muted />
            </TableCell>

            <TableCell className="align-top hidden 2xl:table-cell">
              <CellText
                value={formatDate(caseItem.initial_report_date)}
                muted
              />
            </TableCell>

            <TableCell className="align-top hidden 2xl:table-cell">
              <CellText value={formatDate(caseItem.final_report_date)} muted />
            </TableCell>

            <TableCell className="align-top hidden 2xl:table-cell">
              <CellText value={caseItem.coordinator?.full_name} muted />
            </TableCell>

            <TableCell className="align-top hidden xl:table-cell">
              <TeamMemberCasesLink
                memberId={caseItem.assistant_id}
                memberName={caseItem.assistant?.full_name}
                role="assistant"
                muted
              />
            </TableCell>

            <TableCell className="sticky left-0 z-10 bg-card align-top group-hover:bg-muted/50">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      className="cursor-pointer"
                      variant="ghost"
                      size="icon-sm"
                      loading={isNavigating && navigatingCaseId === caseItem.id}
                      disabled={isNavigating}
                    >
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">فتح القائمة</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onClick={() => navigateTo(`/cases/${caseItem.id}`, caseItem.id)}
                  >
                    <Eye className="size-4" />
                    عرض التفاصيل
                  </DropdownMenuItem>
                  {canEdit && (
                    <DropdownMenuItem
                      onClick={() =>
                        navigateTo(`/cases/${caseItem.id}/edit`, caseItem.id)
                      }
                    >
                      <Pencil className="size-4" />
                      تعديل القضية
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
