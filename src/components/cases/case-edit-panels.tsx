"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";

import { CaseForm, type CaseFormHandle } from "@/components/cases/case-form";
import {
  CaseMilestonesPanel,
  type CaseMilestonesPanelHandle,
} from "@/components/cases/case-milestones-panel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { updateCase } from "@/lib/actions/cases";
import { CASE_MILESTONE_KEYS, type CaseMilestoneKey } from "@/lib/case-milestones";
import {
  emptyDate,
  type CaseFormDateContext,
  type CaseFormValues,
} from "@/lib/validations/case";
import type { CaseWithRelations, Profile } from "@/types/database";

interface CaseEditPanelsProps {
  caseId: string;
  caseData: CaseWithRelations;
  profiles: Pick<Profile, "id" | "full_name" | "role">[];
}

function buildMilestoneState(
  caseItem: CaseWithRelations
): Record<CaseMilestoneKey, string | null> {
  return CASE_MILESTONE_KEYS.reduce(
    (acc, key) => {
      acc[key] = caseItem[key] ?? null;
      return acc;
    },
    {} as Record<CaseMilestoneKey, string | null>
  );
}

function toDateContext(
  caseItem: CaseWithRelations,
  milestones: Record<CaseMilestoneKey, string | null>
): CaseFormDateContext {
  return {
    assignment_date: caseItem.assignment_date,
    meeting_date: caseItem.meeting_date,
    initial_report_date: caseItem.initial_report_date,
    final_report_date: caseItem.final_report_date,
    ...milestones,
  };
}

function scheduleDatesFromValues(values: CaseFormValues) {
  return {
    assignment_date: emptyDate(values.assignment_date),
    meeting_date: emptyDate(values.meeting_date),
    initial_report_date: emptyDate(values.initial_report_date),
    final_report_date: emptyDate(values.final_report_date),
  };
}

export function CaseEditPanels({
  caseId,
  caseData,
  profiles,
}: CaseEditPanelsProps) {
  const router = useRouter();
  const formRef = useRef<CaseFormHandle>(null);
  const milestonesRef = useRef<CaseMilestonesPanelHandle>(null);
  const [isPending, startTransition] = useTransition();
  const [draftMilestones, setDraftMilestones] = useState(() =>
    buildMilestoneState(caseData)
  );

  const dateContext = useMemo(
    () => toDateContext(caseData, draftMilestones),
    [caseData, draftMilestones]
  );

  function handleSave() {
    const form = formRef.current;
    const milestonesPanel = milestonesRef.current;
    if (!form || !milestonesPanel) return;

    form.setFormError(null);

    const values = form.getValues();
    const scheduleDates = scheduleDatesFromValues(values);

    startTransition(async () => {
      const milestonesValid = milestonesPanel.validate(scheduleDates);
      const formValid = await form.triggerValidation();

      if (!milestonesValid || !formValid) return;

      const result = await updateCase(caseId, values, milestonesPanel.getDates());

      if (result && "success" in result && result.success) {
        router.push(`/cases/${caseId}`);
        router.refresh();
        return;
      }

      if (result?.error) {
        const err = result.error as Record<string, string[] | undefined>;
        form.applyFieldErrors(err);
      }
    });
  }

  return (
    <div className="space-y-6">
      <CaseForm
        ref={formRef}
        formId="case-edit-form"
        hideSubmit
        validateOnChange={false}
        profiles={profiles}
        initialData={caseData}
        dateContext={dateContext}
        onSubmit={async () => ({})}
        submitLabel="حفظ التعديلات"
        onPendingChange={() => undefined}
      />

      <CaseMilestonesPanel
        ref={milestonesRef}
        caseId={caseId}
        caseData={caseData}
        deferSave
        onDraftChange={setDraftMilestones}
      />

      <Separator />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-start">
        <Button
          type="button"
          onClick={handleSave}
          loading={isPending}
          className="w-full sm:w-auto"
        >
          حفظ التعديلات
        </Button>
      </div>
    </div>
  );
}
