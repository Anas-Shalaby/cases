"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, Trash2 } from "lucide-react";

import { completeCaseTask, deleteCaseTask } from "@/lib/actions/case-tasks";
import { formatDeadlineUrgency } from "@/lib/case-deadlines";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/ui/nav-button";
import { cn, formatDate } from "@/lib/utils";
import type { CaseTaskWithRelations } from "@/types/database";

interface TaskCardProps {
  task: CaseTaskWithRelations;
  canComplete?: boolean;
  canDelete?: boolean;
  showAssignee?: boolean;
}

export function TaskCard({
  task,
  canComplete = false,
  canDelete = false,
  showAssignee = false,
}: TaskCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const daysUntil = Math.round(
    (new Date(task.due_date).setHours(0, 0, 0, 0) -
      new Date(today).setHours(0, 0, 0, 0)) /
      (1000 * 60 * 60 * 24)
  );
  const isPastDue = task.status === "pending" && daysUntil < 0;

  function handleComplete() {
    setError(null);
    startTransition(async () => {
      const result = await completeCaseTask(task.id);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteCaseTask(task.id, task.case_id);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        task.status === "completed"
          ? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900 dark:bg-emerald-950/20"
          : isPastDue
            ? "border-destructive/30 bg-destructive/5"
            : "border-violet-200 bg-violet-50/30 dark:border-violet-900 dark:bg-violet-950/20"
      )}
    >
      {error && (
        <p className="mb-3 text-sm text-destructive">{error}</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{task.title}</p>
            <Badge
              variant={task.status === "completed" ? "secondary" : "outline"}
              className={cn(
                task.status === "pending" &&
                  isPastDue &&
                  "border-destructive text-destructive"
              )}
            >
              {task.status === "completed" ? "مكتملة" : "معلّقة"}
            </Badge>
          </div>

          {task.description && (
            <p className="text-muted-foreground text-sm">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <NavLink
              href={`/cases/${task.case_id}`}
              className="font-medium hover:text-primary hover:underline"
            >
              {task.case?.case_name ?? "القضية"}
            </NavLink>
            <span className="text-muted-foreground" dir="ltr">
              {task.case?.case_number}
            </span>
          </div>

          <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {showAssignee && (
              <span>
                المكلّف: {task.assignee?.full_name ?? "—"}
                {task.assignee?.role
                  ? ` (${USER_ROLE_LABELS[task.assignee.role]})`
                  : ""}
              </span>
            )}
            <span>أُسندت بواسطة: {task.creator?.full_name ?? "—"}</span>
            <span>تاريخ الإسناد: {formatDate(task.created_at)}</span>
          </div>

          <p
            className={cn(
              "text-xs font-medium",
              task.status === "completed"
                ? "text-muted-foreground"
                : isPastDue
                  ? "text-destructive"
                  : "text-amber-700 dark:text-amber-300"
            )}
          >
            {task.status === "completed" && task.completed_at ? (
              <>أُنجزت: {formatDate(task.completed_at)}</>
            ) : (
              <>
                الموعد النهائي: {formatDate(task.due_date)} —{" "}
                {formatDeadlineUrgency(daysUntil)}
              </>
            )}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          {canComplete && task.status === "pending" && (
            <Button size="sm" loading={isPending} onClick={handleComplete}>
              <CheckCircle2 className="size-4" />
              تم الإنجاز
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              loading={isPending}
              onClick={handleDelete}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
