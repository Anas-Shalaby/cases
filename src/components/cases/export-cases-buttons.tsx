"use client";

import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useState } from "react";

import { downloadCasesExcel } from "@/lib/export-cases-excel";
import { downloadCasesWord } from "@/lib/export-cases-word";
import { safeExportFilename } from "@/lib/case-export-data";
import { Button } from "@/components/ui/button";
import type { CaseWithRelations } from "@/types/database";

interface ExportCasesButtonsProps {
  cases: CaseWithRelations[];
  expertName?: string;
  periodLabel?: string;
  disabled?: boolean;
  size?: "sm" | "default";
}

function buildExportBaseName(
  expertName?: string,
  periodLabel?: string
): string {
  const date = new Date().toISOString().slice(0, 10);
  if (expertName && periodLabel) {
    return safeExportFilename(`قضايا-${expertName}-${periodLabel}`);
  }
  if (expertName) {
    return safeExportFilename(`قضايا-${expertName}-${date}`);
  }
  if (periodLabel) {
    return safeExportFilename(`تقرير-${periodLabel}`);
  }
  return safeExportFilename(`قضايا-${date}`);
}

function buildWordTitle(
  expertName?: string,
  periodLabel?: string,
  count?: number
): string {
  const parts = ["تقرير القضايا"];
  if (expertName) parts.push(`— الخبير: ${expertName}`);
  if (periodLabel) parts.push(`— ${periodLabel}`);
  if (count !== undefined) parts.push(`(${count} قضية)`);
  return parts.join(" ");
}

export function ExportCasesButtons({
  cases,
  expertName,
  periodLabel,
  disabled = false,
  size = "sm",
}: ExportCasesButtonsProps) {
  const [loading, setLoading] = useState<"excel" | "word" | null>(null);

  const isEmpty = cases.length === 0;
  const isDisabled = disabled || isEmpty || loading !== null;

  async function handleExcel() {
    setLoading("excel");
    try {
      downloadCasesExcel(
        cases,
        buildExportBaseName(expertName, periodLabel)
      );
    } finally {
      setLoading(null);
    }
  }

  async function handleWord() {
    setLoading("word");
    try {
      await downloadCasesWord(
        cases,
        buildWordTitle(expertName, periodLabel, cases.length),
        buildExportBaseName(expertName, periodLabel)
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled={isDisabled}
        onClick={handleExcel}
      >
        {loading === "excel" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="size-4" />
        )}
        Excel
      </Button>
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled={isDisabled}
        onClick={handleWord}
      >
        {loading === "word" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <FileText className="size-4" />
        )}
        Word
      </Button>
    </div>
  );
}
