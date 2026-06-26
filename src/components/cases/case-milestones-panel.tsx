"use client";

import {
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { CheckCircle2, Circle } from "lucide-react";

import {
  toggleCaseMilestone,
  updateCaseMilestoneDate,
} from "@/lib/actions/case-milestones";
import {
  buildMilestoneStateAfterUpdate,
  validateCaseDates,
  validateMilestoneDate,
} from "@/lib/case-date-rules";
import { CASE_MILESTONES, type CaseMilestoneKey } from "@/lib/case-milestones";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Case, CaseStatus } from "@/types/database";

export type MilestoneScheduleDates = {
  assignment_date: string | null;
  meeting_date: string | null;
  initial_report_date: string | null;
  final_report_date: string | null;
};

export type CaseMilestonesPanelHandle = {
  validate: (scheduleDates: MilestoneScheduleDates) => boolean;
  getDates: () => Record<CaseMilestoneKey, string | null>;
};

interface CaseMilestonesPanelProps {
  caseId: string;
  caseData: Case;
  readOnly?: boolean;
  deferSave?: boolean;
  onStatusChange?: (status: CaseStatus) => void;
  onCloseMilestoneChange?: (update: {
    caseClosedAt: string | null;
    status: CaseStatus;
  }) => void;
  onDraftChange?: (dates: Record<CaseMilestoneKey, string | null>) => void;
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function buildMilestoneState(caseData: Case): Record<CaseMilestoneKey, string | null> {
  return CASE_MILESTONES.reduce(
    (acc, { key }) => {
      acc[key] = caseData[key] ?? null;
      return acc;
    },
    {} as Record<CaseMilestoneKey, string | null>
  );
}

export const CaseMilestonesPanel = forwardRef<
  CaseMilestonesPanelHandle,
  CaseMilestonesPanelProps
>(function CaseMilestonesPanel(
  {
    caseId,
    caseData,
    readOnly = false,
    deferSave = false,
    onStatusChange,
    onCloseMilestoneChange,
    onDraftChange,
  },
  ref
) {
  const [dates, setDates] = useState(() => buildMilestoneState(caseData));
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<CaseMilestoneKey, string>>
  >({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [pendingKey, setPendingKey] = useState<CaseMilestoneKey | null>(null);

  function updateDates(
    updater: (
      prev: Record<CaseMilestoneKey, string | null>
    ) => Record<CaseMilestoneKey, string | null>
  ) {
    setDates((prev) => {
      const next = updater(prev);
      if (deferSave) {
        onDraftChange?.(next);
      }
      return next;
    });
  }

  function clearFieldError(key: CaseMilestoneKey) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function buildMergedContext(scheduleDates: MilestoneScheduleDates) {
    return {
      ...caseData,
      ...scheduleDates,
      ...dates,
    };
  }

  function runValidation(scheduleDates: MilestoneScheduleDates): boolean {
    const merged = buildMergedContext(scheduleDates);
    const errors: Partial<Record<CaseMilestoneKey, string>> = {};

    for (const { key } of CASE_MILESTONES) {
      const value = dates[key];
      if (!value) continue;
      const err = validateMilestoneDate(merged, key, value);
      if (err) errors[key] = err;
    }

    const fullError = validateCaseDates(merged);
    setFieldErrors(errors);
    setGeneralError(
      fullError && Object.keys(errors).length === 0 ? fullError : null
    );

    return Object.keys(errors).length === 0 && !fullError;
  }

  useImperativeHandle(ref, () => ({
    validate: runValidation,
    getDates: () => dates,
  }));

  async function saveToggle(
    key: CaseMilestoneKey,
    checked: boolean,
    dateToSave: string | null
  ) {
    setIsPending(true);
    setPendingKey(key);

    const result = await toggleCaseMilestone(caseId, key, checked, dateToSave);

    setIsPending(false);
    setPendingKey(null);

    if (result.error) {
      setFieldErrors((prev) => ({ ...prev, [key]: result.error! }));
      setDates(buildMilestoneState(caseData));
      return;
    }

    if (result.success) {
      setDates((prev) => ({ ...prev, [key]: result.date }));

      if (key === "case_closed_at" && result.status) {
        onStatusChange?.(result.status);
        onCloseMilestoneChange?.({
          caseClosedAt: result.date,
          status: result.status,
        });
      }
    }
  }

  async function saveDate(key: CaseMilestoneKey, dateValue: string) {
    setIsPending(true);
    setPendingKey(key);

    const result = await updateCaseMilestoneDate(caseId, key, dateValue);

    setIsPending(false);
    setPendingKey(null);

    if (result.error) {
      setFieldErrors((prev) => ({ ...prev, [key]: result.error! }));
      setDates(buildMilestoneState(caseData));
      return;
    }

    if (result.success) {
      setDates((prev) => ({ ...prev, [key]: result.date }));
    }
  }

  function handleToggle(key: CaseMilestoneKey, checked: boolean) {
    if (readOnly) return;

    clearFieldError(key);
    setGeneralError(null);

    const dateToSave = checked ? (dates[key] ?? todayDateString()) : null;

    if (deferSave) {
      updateDates((prev) => ({ ...prev, [key]: dateToSave }));
      return;
    }

    if (checked && !dates[key]) {
      updateDates((prev) => ({ ...prev, [key]: dateToSave }));
    }

    void saveToggle(key, checked, dateToSave);
  }

  function handleDateChange(key: CaseMilestoneKey, value: string) {
    clearFieldError(key);
    setGeneralError(null);
    updateDates((prev) => ({ ...prev, [key]: value || null }));
  }

  function handleDateBlur(key: CaseMilestoneKey) {
    if (readOnly || deferSave || !dates[key]) return;

    const dateValue = dates[key]!;
    if (dateValue === (caseData[key] ?? null)) return;

    void saveDate(key, dateValue);
  }

  const completedCount = CASE_MILESTONES.filter(({ key }) => dates[key]).length;
  const hasErrors = Object.keys(fieldErrors).length > 0 || !!generalError;

  return (
    <Card>
      <CardHeader>
        <CardTitle>مراحل إنجاز القضية</CardTitle>
        <CardDescription>
          {readOnly
            ? `تم إنجاز ${completedCount} من ${CASE_MILESTONES.length} مراحل`
            : deferSave
              ? "عدّل المراحل والتواريخ ثم اضغط «حفظ التعديلات» — التحقق يتم عند الحفظ"
              : "ضع علامة ✓ عند إتمام كل مرحلة — عند غلق القضية تتغير حالتها إلى «مغلقة» تلقائياً"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {hasErrors && (
          <div className="mb-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {generalError ?? "صحّح تواريخ المراحل غير الصالحة الموضّحة أدناه"}
          </div>
        )}

        <ul className="divide-y rounded-lg border">
          {CASE_MILESTONES.map(({ key, label }) => {
            const isDone = !!dates[key];
            const isLoading = isPending && pendingKey === key;
            const fieldError = fieldErrors[key];

            return (
              <li
                key={key}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 transition-colors sm:items-center sm:gap-4",
                  isDone && "bg-emerald-50/50 dark:bg-emerald-950/20",
                  isLoading && "opacity-60",
                  fieldError && "bg-destructive/5"
                )}
              >
                {readOnly ? (
                  isDone ? (
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="text-muted-foreground size-5 shrink-0" />
                  )
                ) : (
                  <Checkbox
                    checked={isDone}
                    disabled={isPending}
                    onCheckedChange={(checked) =>
                      handleToggle(key, checked === true)
                    }
                    aria-label={label}
                  />
                )}

                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <span
                      className={cn(
                        "text-sm font-medium leading-snug",
                        isDone && "text-emerald-800 dark:text-emerald-300"
                      )}
                    >
                      {label}
                    </span>
                    {fieldError && (
                      <p className="text-destructive mt-1 text-xs">{fieldError}</p>
                    )}
                  </div>

                  {readOnly ? (
                    isDone ? (
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {dates[key]}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs sm:shrink-0">
                        لم تُنجَز بعد
                      </span>
                    )
                  ) : isDone ? (
                    <Input
                      type="date"
                      value={dates[key] ?? ""}
                      disabled={isPending}
                      onChange={(e) => handleDateChange(key, e.target.value)}
                      onBlur={() => handleDateBlur(key)}
                      aria-invalid={!!fieldError}
                      className={cn(
                        "h-8 w-full max-w-[160px] text-xs sm:shrink-0",
                        fieldError && "border-destructive"
                      )}
                      dir="ltr"
                    />
                  ) : (
                    <span className="text-muted-foreground text-xs sm:shrink-0">
                      لم تُنجَز بعد
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
});
