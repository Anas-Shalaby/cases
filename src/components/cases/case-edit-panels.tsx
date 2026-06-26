"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { CaseForm } from "@/components/cases/case-form";
import { CaseMilestonesPanel } from "@/components/cases/case-milestones-panel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { CaseFormDateContext, CaseFormValues } from "@/lib/validations/case";
import { CASE_MILESTONE_KEYS, type CaseMilestoneKey } from "@/lib/case-milestones";
import type { CaseStatus, CaseWithRelations, Profile } from "@/types/database";

const CASE_EDIT_FORM_ID = "case-edit-form";

interface CaseEditPanelsProps {
  caseId: string;
  caseData: CaseWithRelations;
  profiles: Pick<Profile, "id" | "full_name" | "role">[];
  onSubmit: (
    values: CaseFormValues
  ) => Promise<{ error?: unknown; success?: boolean; id?: string } | void>;
}

function toDateContext(caseItem: CaseWithRelations): CaseFormDateContext {
  return {
    assignment_date: caseItem.assignment_date,
    meeting_date: caseItem.meeting_date,
    initial_report_date: caseItem.initial_report_date,
    final_report_date: caseItem.final_report_date,
    case_received_at: caseItem.case_received_at,
    parties_invited_at: caseItem.parties_invited_at,
    experts_meeting_at: caseItem.experts_meeting_at,
    defendant_documents_received_at: caseItem.defendant_documents_received_at,
    plaintiff_documents_received_at: caseItem.plaintiff_documents_received_at,
    initial_report_prepared_at: caseItem.initial_report_prepared_at,
    final_report_prepared_at: caseItem.final_report_prepared_at,
    case_closed_at: caseItem.case_closed_at,
  };
}

export function CaseEditPanels({
  caseId,
  caseData,
  profiles,
  onSubmit,
}: CaseEditPanelsProps) {
  const router = useRouter();
  const [caseSnapshot, setCaseSnapshot] = useState(caseData);
  const [hasDateErrors, setHasDateErrors] = useState(false);
  const [formHasErrors, setFormHasErrors] = useState(false);
  const [formPending, setFormPending] = useState(false);

  const dateContext = useMemo(() => toDateContext(caseSnapshot), [caseSnapshot]);

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

  function handleMilestoneDateChange(
    key: CaseMilestoneKey,
    value: string | null
  ) {
    setCaseSnapshot((prev) => ({ ...prev, [key]: value }));
  }

  const saveDisabled = formPending || formHasErrors || hasDateErrors;
  const milestonesKey = CASE_MILESTONE_KEYS.map(
    (key) => caseSnapshot[key] ?? ""
  ).join("|");

  return (
    <div className="space-y-6">
      <CaseForm
        formId={CASE_EDIT_FORM_ID}
        hideSubmit
        profiles={profiles}
        initialData={caseSnapshot}
        dateContext={dateContext}
        onSubmit={onSubmit}
        submitLabel="حفظ التعديلات"
        onValidationChange={setFormHasErrors}
        onPendingChange={setFormPending}
      />

      <CaseMilestonesPanel
        key={milestonesKey}
        caseId={caseId}
        caseData={caseSnapshot}
        onStatusChange={handleStatusChange}
        onCloseMilestoneChange={handleMilestoneSync}
        onMilestoneDateChange={handleMilestoneDateChange}
        onValidationChange={setHasDateErrors}
      />

      <Separator />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-start">
        <Button
          type="submit"
          form={CASE_EDIT_FORM_ID}
          disabled={saveDisabled}
          className="w-full sm:w-auto"
        >
          {formPending && <Loader2 className="size-4 animate-spin" />}
          حفظ التعديلات
        </Button>
      </div>
    </div>
  );
}
