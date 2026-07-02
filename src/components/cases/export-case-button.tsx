"use client";

import { FileSpreadsheet } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { downloadCaseExcel } from "@/lib/export-case-excel";
import type { CaseDocument, CaseWithRelations } from "@/types/database";

interface ExportCaseButtonProps {
  caseData: CaseWithRelations;
  documents?: CaseDocument[];
  size?: "sm" | "default";
}

export function ExportCaseButton({
  caseData,
  documents = [],
  size = "default",
}: ExportCaseButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      await downloadCaseExcel(caseData, documents);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      loading={loading}
      disabled={loading}
      onClick={handleExport}
    >
      {loading ? null : <FileSpreadsheet className="size-4" />}
      تصدير Excel
    </Button>
  );
}
