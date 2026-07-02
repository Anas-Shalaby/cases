import { formatDefendantNames, formatPlaintiffNames } from "@/lib/case-parties";
import { CASE_MILESTONES } from "@/lib/case-milestones";
import { CASE_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { CaseWithRelations } from "@/types/database";

export const CASE_EXPORT_HEADERS = [
  "رقم القضية",
  "اسم القضية",
  "الحالة",
  "تاريخ التكليف",
  "تاريخ الاجتماع",
  "التقرير المبدئي",
  "التقرير النهائي",
  "المدعي",
  "المدعى عليه",
  "المنسق",
  "الخبير",
  "مساعد الخبير",
  ...CASE_MILESTONES.map((m) => m.label),
] as const;

export function buildCaseExportRows(
  cases: CaseWithRelations[]
): Record<string, string>[] {
  return cases.map((c) => {
    const row: Record<string, string> = {
      "رقم القضية": c.case_number,
      "اسم القضية": c.case_name,
      الحالة: CASE_STATUS_LABELS[c.status],
      "تاريخ التكليف": formatDate(c.assignment_date),
      "تاريخ الاجتماع": formatDate(c.meeting_date),
      "التقرير المبدئي": formatDate(c.initial_report_date),
      "التقرير النهائي": formatDate(c.final_report_date),
      المدعي: formatPlaintiffNames(c.parties),
      "المدعى عليه": formatDefendantNames(c.parties),
      المنسق: c.coordinator?.full_name ?? "—",
      الخبير: c.expert?.full_name ?? "—",
      "مساعد الخبير": c.assistant?.full_name ?? "—",
    };

    for (const milestone of CASE_MILESTONES) {
      row[milestone.label] = formatDate(c[milestone.key]);
    }

    return row;
  });
}

export function safeExportFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, "-").trim() || "تصدير-القضايا";
}
