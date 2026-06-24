import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import {
  buildCaseExportRows,
  CASE_EXPORT_HEADERS,
  safeExportFilename,
} from "@/lib/case-export-data";
import type { CaseWithRelations } from "@/types/database";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function cellParagraph(text: string, bold = false) {
  return new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    children: [
      new TextRun({
        text,
        bold,
        rightToLeft: true,
        font: "Arial",
      }),
    ],
  });
}

export async function downloadCasesWord(
  cases: CaseWithRelations[],
  title: string,
  baseFilename: string
) {
  const rows = buildCaseExportRows(cases);
  const headers = [...CASE_EXPORT_HEADERS];

  const headerRow = new TableRow({
    children: headers.map(
      (header) =>
        new TableCell({
          width: { size: 14, type: WidthType.PERCENTAGE },
          children: [cellParagraph(header, true)],
        })
    ),
  });

  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: headers.map(
          (header) =>
            new TableCell({
              children: [cellParagraph(row[header] ?? "—")],
            })
        ),
      })
  );

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    visuallyRightToLeft: true,
    rows: [headerRow, ...dataRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: 32,
                rightToLeft: true,
                font: "Arial",
              }),
            ],
          }),
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `عدد القضايا: ${cases.length}`,
                rightToLeft: true,
                font: "Arial",
              }),
            ],
          }),
          new Paragraph({ text: "" }),
          table,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${safeExportFilename(baseFilename)}.docx`);
}
