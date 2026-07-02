import ExcelJS from "exceljs";

import { getPartiesByType } from "@/lib/case-parties";
import { CASE_MILESTONES } from "@/lib/case-milestones";
import { CASE_SCHEDULE_FIELDS } from "@/lib/case-date-rules";
import { safeExportFilename } from "@/lib/case-export-data";
import { CASE_STATUS_LABELS, USER_ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { CaseDocument, CaseWithRelations } from "@/types/database";

const COLS = 4;

const COLORS = {
  primary: "FF1E3A5F",
  primaryLight: "FFE8EEF4",
  section: "FF2E5077",
  label: "FFF3F4F6",
  white: "FFFFFFFF",
  border: "FFD1D5DB",
  muted: "FF6B7280",
  accent: "FF0F766E",
} as const;

type RowRef = { current: number };

function display(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function thinBorder(): Partial<ExcelJS.Borders> {
  return {
    top: { style: "thin", color: { argb: COLORS.border } },
    left: { style: "thin", color: { argb: COLORS.border } },
    bottom: { style: "thin", color: { argb: COLORS.border } },
    right: { style: "thin", color: { argb: COLORS.border } },
  };
}

function styleCell(
  cell: ExcelJS.Cell,
  options: {
    bold?: boolean;
    size?: number;
    fill?: string;
    color?: string;
    horizontal?: ExcelJS.Alignment["horizontal"];
    wrap?: boolean;
  } = {}
) {
  cell.font = {
    name: "Arial",
    bold: options.bold ?? false,
    size: options.size ?? 11,
    color: options.color ? { argb: options.color } : undefined,
  };
  cell.alignment = {
    vertical: "middle",
    horizontal: options.horizontal ?? "right",
    wrapText: options.wrap ?? true,
    readingOrder: "rtl",
  };
  cell.border = thinBorder();
  if (options.fill) {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: options.fill },
    };
  }
}

function mergeAndStyle(
  worksheet: ExcelJS.Worksheet,
  row: number,
  fromCol: number,
  toCol: number,
  value: string,
  options: Parameters<typeof styleCell>[1] = {}
) {
  worksheet.mergeCells(row, fromCol, row, toCol);
  const cell = worksheet.getCell(row, fromCol);
  cell.value = value;
  styleCell(cell, options);
  for (let col = fromCol + 1; col <= toCol; col++) {
    styleCell(worksheet.getCell(row, col), options);
  }
}

function setRowHeight(worksheet: ExcelJS.Worksheet, row: number, height: number) {
  worksheet.getRow(row).height = height;
}

function addSpacer(worksheet: ExcelJS.Worksheet, rowRef: RowRef) {
  rowRef.current += 1;
  setRowHeight(worksheet, rowRef.current, 8);
}

function addSectionHeader(
  worksheet: ExcelJS.Worksheet,
  rowRef: RowRef,
  title: string
) {
  const row = rowRef.current;
  mergeAndStyle(worksheet, row, 1, COLS, title, {
    bold: true,
    size: 12,
    fill: COLORS.section,
    color: COLORS.white,
    horizontal: "right",
  });
  setRowHeight(worksheet, row, 28);
  rowRef.current += 1;
}

function addKeyValueRow(
  worksheet: ExcelJS.Worksheet,
  rowRef: RowRef,
  label: string,
  value: string,
  options?: { valueDir?: "ltr" | "rtl"; labelSpan?: number; valueSpan?: number }
) {
  const row = rowRef.current;
  const labelSpan = options?.labelSpan ?? 1;
  const valueSpan = options?.valueSpan ?? COLS - labelSpan;

  if (labelSpan > 1) {
    worksheet.mergeCells(row, 1, row, labelSpan);
  }
  if (valueSpan > 1) {
    worksheet.mergeCells(row, labelSpan + 1, row, COLS);
  }

  const labelCell = worksheet.getCell(row, 1);
  labelCell.value = label;
  styleCell(labelCell, { bold: true, fill: COLORS.label });

  const valueCell = worksheet.getCell(row, labelSpan + 1);
  valueCell.value = value;
  styleCell(valueCell, {
    horizontal: options?.valueDir === "ltr" ? "left" : "right",
  });

  for (let col = 2; col <= labelSpan; col++) {
    styleCell(worksheet.getCell(row, col), { bold: true, fill: COLORS.label });
  }
  for (let col = labelSpan + 2; col <= COLS; col++) {
    styleCell(worksheet.getCell(row, col));
  }

  setRowHeight(worksheet, row, 22);
  rowRef.current += 1;
}

function addPairRow(
  worksheet: ExcelJS.Worksheet,
  rowRef: RowRef,
  label1: string,
  value1: string,
  label2: string,
  value2: string,
  options?: { value1Dir?: "ltr" | "rtl"; value2Dir?: "ltr" | "rtl" }
) {
  const row = rowRef.current;

  const cells = [
    { col: 1, value: label1, label: true },
    { col: 2, value: value1, label: false, dir: options?.value1Dir },
    { col: 3, value: label2, label: true },
    { col: 4, value: value2, label: false, dir: options?.value2Dir },
  ] as const;

  for (const item of cells) {
    const cell = worksheet.getCell(row, item.col);
    cell.value = item.value;
    styleCell(cell, {
      bold: item.label,
      fill: item.label ? COLORS.label : COLORS.white,
      horizontal: !item.label && item.dir === "ltr" ? "left" : "right",
    });
  }

  setRowHeight(worksheet, row, 22);
  rowRef.current += 1;
}

function addSubsectionTitle(
  worksheet: ExcelJS.Worksheet,
  rowRef: RowRef,
  title: string
) {
  const row = rowRef.current;
  mergeAndStyle(worksheet, row, 1, COLS, title, {
    bold: true,
    size: 11,
    fill: COLORS.primaryLight,
    color: COLORS.primary,
    horizontal: "right",
  });
  setRowHeight(worksheet, row, 24);
  rowRef.current += 1;
}

function addTableHeader(
  worksheet: ExcelJS.Worksheet,
  rowRef: RowRef,
  headers: string[]
) {
  const row = rowRef.current;
  headers.forEach((header, index) => {
    const cell = worksheet.getCell(row, index + 1);
    cell.value = header;
    styleCell(cell, {
      bold: true,
      fill: COLORS.primary,
      color: COLORS.white,
      horizontal: "center",
    });
  });
  setRowHeight(worksheet, row, 24);
  rowRef.current += 1;
}

function addTableRow(
  worksheet: ExcelJS.Worksheet,
  rowRef: RowRef,
  values: string[],
  options?: { striped?: boolean; dirs?: ("ltr" | "rtl")[] }
) {
  const row = rowRef.current;
  values.forEach((value, index) => {
    const cell = worksheet.getCell(row, index + 1);
    cell.value = value;
    styleCell(cell, {
      fill: options?.striped ? COLORS.label : COLORS.white,
      horizontal: options?.dirs?.[index] === "ltr" ? "left" : "right",
    });
  });
  setRowHeight(worksheet, row, 22);
  rowRef.current += 1;
}

function addPartyBlock(
  worksheet: ExcelJS.Worksheet,
  rowRef: RowRef,
  partyLabel: string,
  agentTitle: string,
  party: {
    name: string;
    phone: string | null;
    email: string | null;
    agent_name: string | null;
    agent_phone: string | null;
    agent_email: string | null;
  },
  index: number,
  total: number
) {
  const title = total > 1 ? `${partyLabel} ${index + 1}` : partyLabel;
  addSubsectionTitle(worksheet, rowRef, title);
  addPairRow(
    worksheet,
    rowRef,
    "الاسم",
    display(party.name),
    "رقم الهاتف",
    display(party.phone),
    { value2Dir: "ltr" }
  );
  addKeyValueRow(worksheet, rowRef, "البريد الإلكتروني", display(party.email), {
    valueDir: "ltr",
    labelSpan: 1,
    valueSpan: 3,
  });
  addSubsectionTitle(worksheet, rowRef, agentTitle);
  addPairRow(
    worksheet,
    rowRef,
    "اسم الوكيل",
    display(party.agent_name),
    "هاتف الوكيل",
    display(party.agent_phone),
    { value2Dir: "ltr" }
  );
  addKeyValueRow(
    worksheet,
    rowRef,
    "بريد الوكيل",
    display(party.agent_email),
    { valueDir: "ltr", labelSpan: 1, valueSpan: 3 }
  );
}

export async function downloadCaseExcel(
  caseData: CaseWithRelations,
  documents: CaseDocument[] = []
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "نظام إدارة القضايا";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("بيانات القضية", {
    views: [{ rightToLeft: true, showGridLines: false }],
    properties: { defaultRowHeight: 22 },
  });

  worksheet.columns = [
    { width: 22 },
    { width: 28 },
    { width: 22 },
    { width: 28 },
  ];

  const rowRef: RowRef = { current: 1 };

  mergeAndStyle(
    worksheet,
    rowRef.current,
    1,
    COLS,
    `تقرير القضية — ${caseData.case_name}`,
    {
      bold: true,
      size: 16,
      fill: COLORS.primary,
      color: COLORS.white,
      horizontal: "center",
    }
  );
  setRowHeight(worksheet, rowRef.current, 36);
  rowRef.current += 1;

  mergeAndStyle(
    worksheet,
    rowRef.current,
    1,
    COLS,
    `رقم القضية: ${caseData.case_number}  |  تاريخ التصدير: ${formatDate(new Date().toISOString())}`,
    {
      size: 10,
      fill: COLORS.primaryLight,
      color: COLORS.muted,
      horizontal: "center",
    }
  );
  setRowHeight(worksheet, rowRef.current, 20);
  rowRef.current += 1;

  addSpacer(worksheet, rowRef);

  addSectionHeader(worksheet, rowRef, "بيانات القضية");
  addPairRow(
    worksheet,
    rowRef,
    "رقم القضية",
    display(caseData.case_number),
    "الحالة",
    CASE_STATUS_LABELS[caseData.status],
    { value1Dir: "ltr" }
  );
  addKeyValueRow(worksheet, rowRef, "اسم القضية", display(caseData.case_name), {
    labelSpan: 1,
    valueSpan: 3,
  });
  addPairRow(
    worksheet,
    rowRef,
    "تاريخ الإنشاء",
    formatDate(caseData.created_at),
    "الأطراف",
    `${getPartiesByType(caseData.parties, "plaintiff").length} مدعي / ${getPartiesByType(caseData.parties, "defendant").length} مدعى عليه`
  );

  addSpacer(worksheet, rowRef);

  addSectionHeader(worksheet, rowRef, "التواريخ المهمة");
  for (let i = 0; i < CASE_SCHEDULE_FIELDS.length; i += 2) {
    const first = CASE_SCHEDULE_FIELDS[i];
    const second = CASE_SCHEDULE_FIELDS[i + 1];
    if (second) {
      addPairRow(
        worksheet,
        rowRef,
        first.label,
        formatDate(caseData[first.key]),
        second.label,
        formatDate(caseData[second.key])
      );
    } else {
      addKeyValueRow(
        worksheet,
        rowRef,
        first.label,
        formatDate(caseData[first.key]),
        { labelSpan: 1, valueSpan: 3 }
      );
    }
  }

  addSpacer(worksheet, rowRef);

  addSectionHeader(worksheet, rowRef, "مراحل الإنجاز");
  addTableHeader(worksheet, rowRef, ["المرحلة", "تاريخ الإنجاز", "الحالة"]);
  CASE_MILESTONES.forEach((milestone, index) => {
    const completedAt = caseData[milestone.key];
    const isDone = Boolean(completedAt);
    const row = rowRef.current;
    const values = [
      milestone.label,
      formatDate(completedAt),
      isDone ? "مكتملة ✓" : "قيد الانتظار",
    ];
    values.forEach((value, colIndex) => {
      const cell = worksheet.getCell(row, colIndex + 1);
      cell.value = value;
      styleCell(cell, {
        fill: index % 2 === 1 ? COLORS.label : COLORS.white,
        horizontal: colIndex === 2 ? "center" : "right",
        color: colIndex === 2 && isDone ? COLORS.accent : undefined,
        bold: colIndex === 2 && isDone,
      });
    });
    styleCell(worksheet.getCell(row, 4), {
      fill: index % 2 === 1 ? COLORS.label : COLORS.white,
    });
    setRowHeight(worksheet, row, 22);
    rowRef.current += 1;
  });

  addSpacer(worksheet, rowRef);

  addSectionHeader(worksheet, rowRef, "فريق العمل");
  addPairRow(
    worksheet,
    rowRef,
    USER_ROLE_LABELS.coordinator,
    display(caseData.coordinator?.full_name),
    USER_ROLE_LABELS.expert,
    display(caseData.expert?.full_name)
  );
  addKeyValueRow(
    worksheet,
    rowRef,
    USER_ROLE_LABELS.assistant,
    display(caseData.assistant?.full_name),
    { labelSpan: 1, valueSpan: 3 }
  );

  addSpacer(worksheet, rowRef);

  const plaintiffs = getPartiesByType(caseData.parties, "plaintiff");
  addSectionHeader(worksheet, rowRef, "بيانات المدعي");
  if (plaintiffs.length === 0) {
    addKeyValueRow(worksheet, rowRef, "لا توجد بيانات", "—", {
      labelSpan: 1,
      valueSpan: 3,
    });
  } else {
    plaintiffs.forEach((party, index) => {
      if (index > 0) addSpacer(worksheet, rowRef);
      addPartyBlock(
        worksheet,
        rowRef,
        "المدعي",
        "بيانات وكيل المدعي",
        party,
        index,
        plaintiffs.length
      );
    });
  }

  addSpacer(worksheet, rowRef);

  const defendants = getPartiesByType(caseData.parties, "defendant");
  addSectionHeader(worksheet, rowRef, "بيانات المدعي عليه");
  if (defendants.length === 0) {
    addKeyValueRow(worksheet, rowRef, "لا توجد بيانات", "—", {
      labelSpan: 1,
      valueSpan: 3,
    });
  } else {
    defendants.forEach((party, index) => {
      if (index > 0) addSpacer(worksheet, rowRef);
      addPartyBlock(
        worksheet,
        rowRef,
        "المدعي عليه",
        "بيانات وكيل المدعي عليه",
        party,
        index,
        defendants.length
      );
    });
  }

  addSpacer(worksheet, rowRef);

  addSectionHeader(worksheet, rowRef, "المستندات");
  if (documents.length === 0) {
    addKeyValueRow(worksheet, rowRef, "لا توجد مستندات", "—", {
      labelSpan: 1,
      valueSpan: 3,
    });
  } else {
    addTableHeader(worksheet, rowRef, [
      "م",
      "عنوان المستند",
      "رافع الملف",
      "تاريخ الرفع",
    ]);
    documents.forEach((document, index) => {
      addTableRow(
        worksheet,
        rowRef,
        [
          String(index + 1),
          display(document.title),
          display(document.uploader?.full_name),
          formatDate(document.created_at),
        ],
        { striped: index % 2 === 1 }
      );
    });
  }

  worksheet.pageSetup = {
    paperSize: 9,
    orientation: "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: {
      left: 0.5,
      right: 0.5,
      top: 0.6,
      bottom: 0.6,
      header: 0.3,
      footer: 0.3,
    },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const filename = safeExportFilename(
    `قضية-${caseData.case_number}-${new Date().toISOString().slice(0, 10)}`
  );
  downloadBlob(blob, `${filename}.xlsx`);
}
