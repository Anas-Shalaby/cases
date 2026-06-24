"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle } from "lucide-react";

import {
  toggleCaseMilestone,
  updateCaseMilestoneDate,
} from "@/lib/actions/case-milestones";
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
import type { Case } from "@/types/database";

interface CaseMilestonesPanelProps {
  caseId: string;
  caseData: Case;
  readOnly?: boolean;
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
}: CaseMilestonesPanelProps) {
  const [dates, setDates] = useState(() => buildMilestoneState(caseData));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<CaseMilestoneKey | null>(null);

  function handleToggle(key: CaseMilestoneKey, checked: boolean) {
    if (readOnly) return;

    setError(null);
    setPendingKey(key);

    const dateToSave = checked ? (dates[key] ?? todayDateString()) : null;

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
        setError(result.error);
        setDates(buildMilestoneState(caseData));
        return;
      }

      if (result.success) {
        setDates((prev) => ({ ...prev, [key]: result.date }));
      }
    });
  }

  function handleDateChange(key: CaseMilestoneKey, value: string) {
    setDates((prev) => ({ ...prev, [key]: value || null }));
  }

  function handleDateBlur(key: CaseMilestoneKey) {
    if (readOnly || !dates[key]) return;

    setError(null);
    setPendingKey(key);

    startTransition(async () => {
      const result = await updateCaseMilestoneDate(caseId, key, dates[key]!);
      setPendingKey(null);

      if (result.error) {
        setError(result.error);
        setDates(buildMilestoneState(caseData));
        return;
      }

      if (result.success) {
        setDates((prev) => ({ ...prev, [key]: result.date }));
      }
    });
  }

  const completedCount = CASE_MILESTONES.filter(({ key }) => dates[key]).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>مراحل إنجاز القضية</CardTitle>
        <CardDescription>
          {readOnly
            ? `تم إنجاز ${completedCount} من ${CASE_MILESTONES.length} مراحل`
            : "ضع علامة ✓ عند إتمام كل مرحلة وعدّل التاريخ بجانبها"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {error && (
          <div className="mb-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <ul className="divide-y rounded-lg border">
          {CASE_MILESTONES.map(({ key, label }) => {
            const isDone = !!dates[key];
            const isLoading = isPending && pendingKey === key;

            return (
              <li
                key={key}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 transition-colors sm:items-center sm:gap-4",
                  isDone && "bg-emerald-50/50 dark:bg-emerald-950/20",
                  isLoading && "opacity-60"
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
                  <span
                    className={cn(
                      "text-sm font-medium leading-snug",
                      isDone && "text-emerald-800 dark:text-emerald-300"
                    )}
                  >
                    {label}
                  </span>

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
                      className="h-8 w-full max-w-[160px] text-xs sm:shrink-0"
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
