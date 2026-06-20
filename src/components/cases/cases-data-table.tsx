"use client";

import Link from "next/link";
import { Eye, MoreHorizontal, Pencil } from "lucide-react";

import { StatusBadge } from "@/components/cases/status-badge";
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
import { USER_ROLE_LABELS } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import type { CaseWithRelations } from "@/types/database";

interface CasesDataTableProps {
  cases: CaseWithRelations[];
  className?: string;
  emptyMessage?: string;
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

function PersonCell({
  name,
  phone,
  email,
}: {
  name: string;
  phone?: string | null;
  email?: string | null;
}) {
  return (
    <div className="min-w-[180px] space-y-0.5">
      <p className="font-medium leading-snug break-words">{name}</p>
      {(phone || email) && (
        <p className="text-muted-foreground text-xs leading-snug" dir="ltr">
          {phone || email}
        </p>
      )}
    </div>
  );
}

export function CasesDataTable({
  cases,
  className,
  emptyMessage = "لا توجد قضايا لعرضها",
}: CasesDataTableProps) {
  if (cases.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-16 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <Table className={cn("min-w-[1650px] w-full table-fixed", className)}>
      <TableHeader>
        <TableRow className="bg-muted/50 hover:bg-muted/50">
          <TableHead className="sticky right-0 z-10 w-[150px] bg-muted/80 backdrop-blur-sm">
            رقم القضية
          </TableHead>
          <TableHead className="w-[220px]">اسم القضية</TableHead>
          <TableHead className="w-[110px]">الحالة</TableHead>
          <TableHead className="w-[200px]">المدعي</TableHead>
          <TableHead className="w-[200px]">المدعي عليه</TableHead>
          <TableHead className="w-[130px]">تاريخ التكليف</TableHead>
          <TableHead className="w-[130px]">تاريخ الاجتماع</TableHead>
          <TableHead className="w-[130px]">التقرير الأولي</TableHead>
          <TableHead className="w-[130px]">التقرير النهائي</TableHead>
          <TableHead className="w-[140px]">{USER_ROLE_LABELS.coordinator}</TableHead>
          <TableHead className="w-[140px]">{USER_ROLE_LABELS.expert}</TableHead>
          <TableHead className="w-[140px]">{USER_ROLE_LABELS.assistant}</TableHead>
          <TableHead className="sticky left-0 z-10 w-[80px] bg-muted/80 backdrop-blur-sm">
            إجراءات
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cases.map((caseItem) => (
          <TableRow key={caseItem.id} className="group">
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
              </Link>
            </TableCell>

            <TableCell className="align-top">
              <StatusBadge status={caseItem.status} />
            </TableCell>

            <TableCell className="align-top">
              <PersonCell
                name={caseItem.plaintiff_name}
                phone={caseItem.plaintiff_phone}
                email={caseItem.plaintiff_email}
              />
            </TableCell>

            <TableCell className="align-top">
              <PersonCell
                name={caseItem.defendant_name}
                phone={caseItem.defendant_phone}
                email={caseItem.defendant_email}
              />
            </TableCell>

            <TableCell className="align-top">
              <CellText value={formatDate(caseItem.assignment_date)} muted />
            </TableCell>

            <TableCell className="align-top">
              <CellText value={formatDate(caseItem.meeting_date)} muted />
            </TableCell>

            <TableCell className="align-top">
              <CellText
                value={formatDate(caseItem.initial_report_date)}
                muted
              />
            </TableCell>

            <TableCell className="align-top">
              <CellText value={formatDate(caseItem.final_report_date)} muted />
            </TableCell>

            <TableCell className="align-top">
              <CellText value={caseItem.coordinator?.full_name} muted />
            </TableCell>

            <TableCell className="align-top">
              <CellText value={caseItem.expert?.full_name} muted />
            </TableCell>

            <TableCell className="align-top">
              <CellText value={caseItem.assistant?.full_name} muted />
            </TableCell>

            <TableCell className="sticky left-0 z-10 bg-card align-top group-hover:bg-muted/50">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button className={'cursor-pointer'} variant="ghost" size="icon-sm">
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">فتح القائمة</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    render={<Link href={`/cases/${caseItem.id}`} />}
                  >
                    <Eye className="size-4" />
                    عرض التفاصيل
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    render={<Link href={`/cases/${caseItem.id}/edit`} />}
                  >
                    <Pencil className="size-4" />
                    تعديل القضية
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
