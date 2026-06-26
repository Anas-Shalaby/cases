"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle } from "lucide-react";

import {
  toggleCaseMilestone,
  updateCaseMilestoneDate,
} from "@/lib/actions/case-milestones";
import {
  buildMilestoneStateAfterUpdate,
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

interface CaseMilestonesPanelProps {
  caseId: string;
  caseData: Case;
  readOnly?: boolean;
  onStatusChange?: (status: CaseStatus) => void;
  onCloseMilestoneChange?: (update: {
    caseClosedAt: string | null;
    status: CaseStatus;
  }) => void;
  onMilestoneDateChange?: (key: CaseMilestoneKey, value: string | null) => void;
  onValidationChange?: (hasErrors: boolean) => void;
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

export function CaseMilestonesPanel({
  caseId,
  caseData,
  readOnly = false,
  onStatusChange,
  onCloseMilestoneChange,
  onMilestoneDateChange,
  onValidationChange,
}: CaseMilestonesPanelProps) {
  const [dates, setDates] = useState(() => buildMilestoneState(caseData));
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<CaseMilestoneKey, string>>
  >({});
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<CaseMilestoneKey | null>(null);

  function clearFieldError(key: CaseMilestoneKey) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      onValidationChange?.(Object.keys(next).length > 0);
      return next;
    });
  }

  function setFieldError(key: CaseMilestoneKey, message: string) {
    setFieldErrors((prev) => {
      const next = { ...prev, [key]: message };
      onValidationChange?.(true);
      return next;
    });
  }

  function validateMilestoneLocally(
    key: CaseMilestoneKey,
    date: string
  ): string | null {
    const nextState = buildMilestoneStateAfterUpdate(
      { ...caseData, ...dates },
      key,
      date
    );
    return validateMilestoneDate(nextState, key, date);
  }

  function handleToggle(key: CaseMilestoneKey, checked: boolean) {
    if (readOnly) return;

    clearFieldError(key);
    setPendingKey(key);

    const dateToSave = checked ? (dates[key] ?? todayDateString()) : null;

    if (checked && dateToSave) {
      const validationError = validateMilestoneLocally(key, dateToSave);
      if (validationError) {
        setFieldError(key, validationError);
        setPendingKey(null);
        return;
      }
    }

    if (checked && !dates[key]) {
      setDates((prev) => ({ ...prev, [key]: dateToSave }));
    }

    startTransition(async () => {
      const result = await toggleCaseMilestone(
        caseId,
        key,
        checked,
        dateToSave
      );
      setPendingKey(null);

      if (result.error) {
        setFieldError(key, result.error);
        setDates(buildMilestoneState(caseData));
        return;
      }

      if (result.success) {
        setDates((prev) => ({ ...prev, [key]: result.date }));
        onMilestoneDateChange?.(key, result.date);

        if (key === "case_closed_at" && result.status) {
          onStatusChange?.(result.status);
          onCloseMilestoneChange?.({
            caseClosedAt: result.date,
            status: result.status,
          });
        }
      }
    });
  }

  function handleDateChange(key: CaseMilestoneKey, value: string) {
    clearFieldError(key);
    setDates((prev) => ({ ...prev, [key]: value || null }));
  }

  function handleDateBlur(key: CaseMilestoneKey) {
    if (readOnly || !dates[key]) return;

    const dateValue = dates[key]!;
    const validationError = validateMilestoneLocally(key, dateValue);

    if (validationError) {
      setFieldError(key, validationError);
      setDates((prev) => ({
        ...prev,
        [key]: caseData[key] ?? null,
      }));
      return;
    }

    if (dateValue === (caseData[key] ?? null)) return;

    setPendingKey(key);

    startTransition(async () => {
      const result = await updateCaseMilestoneDate(caseId, key, dateValue);
      setPendingKey(null);

      if (result.error) {
        setFieldError(key, result.error);
        setDates(buildMilestoneState(caseData));
        return;
      }

      if (result.success) {
        setDates((prev) => ({ ...prev, [key]: result.date }));
        onMilestoneDateChange?.(key, result.date);
      }
    });
  }

  const completedCount = CASE_MILESTONES.filter(({ key }) => dates[key]).length;
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>مراحل إنجاز القضية</CardTitle>
        <CardDescription>
          {readOnly
            ? `تم إنجاز ${completedCount} من ${CASE_MILESTONES.length} مراحل`
            : "ضع علامة ✓ عند إتمام كل مرحلة — عند غلق القضية تتغير حالتها إلى «مغلقة» تلقائياً"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {hasFieldErrors && (
          <div className="mb-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            صحّح تواريخ المراحل غير الصالحة قبل حفظ التعديلات
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
}
