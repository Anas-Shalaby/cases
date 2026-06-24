"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CaseForm } from "@/components/cases/case-form";
import { CaseMilestonesPanel } from "@/components/cases/case-milestones-panel";
import type { CaseFormValues } from "@/lib/validations/case";
import type { CaseStatus, CaseWithRelations, Profile } from "@/types/database";

interface CaseEditPanelsProps {
  caseId: string;
  caseData: CaseWithRelations;
  profiles: Pick<Profile, "id" | "full_name" | "role">[];
  onSubmit: (
    values: CaseFormValues
  ) => Promise<{ error?: unknown; success?: boolean; id?: string } | void>;
}

export function CaseEditPanels({
  caseId,
  caseData,
  profiles,
  onSubmit,
}: CaseEditPanelsProps) {
  const router = useRouter();
  const [caseSnapshot, setCaseSnapshot] = useState(caseData);

  function handleStatusChange(status: CaseStatus) {
    setCaseSnapshot((prev) => ({ ...prev, status }));
  }

  function handleMilestoneSync(update: {
    caseClosedAt: string | null;
    status: CaseStatus;
  }) {
    setCaseSnapshot((prev) => ({
      ...prev,
      case_closed_at: update.caseClosedAt,
      status: update.status,
    }));
    router.refresh();
  }

  return (
    <>
      <CaseForm
        key={`${caseSnapshot.status}-${caseSnapshot.case_closed_at ?? "open"}`}
        profiles={profiles}
        initialData={caseSnapshot}
        onSubmit={onSubmit}
        submitLabel="حفظ التعديلات"
      />
      <CaseMilestonesPanel
        caseId={caseId}
        caseData={caseSnapshot}
        onStatusChange={handleStatusChange}
        onCloseMilestoneChange={handleMilestoneSync}
      />
    </>
  );
}
