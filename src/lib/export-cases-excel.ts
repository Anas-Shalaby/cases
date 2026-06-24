import * as XLSX from "xlsx";

import {
  buildCaseExportRows,
  CASE_EXPORT_HEADERS,
  safeExportFilename,
} from "@/lib/case-export-data";
import type { CaseWithRelations } from "@/types/database";

export function downloadCasesExcel(
  cases: CaseWithRelations[],
  baseFilename: string
) {
  const rows = buildCaseExportRows(cases);
  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: [...CASE_EXPORT_HEADERS],
  });
  worksheet["!rtl"] = true;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "القضايا");
  XLSX.writeFile(workbook, `${safeExportFilename(baseFilename)}.xlsx`);
}
