"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, ClipboardList, Trash2 } from "lucide-react";

import { CreateCaseTaskDialog } from "@/components/dashboard/create-case-task-dialog";
import { completeCaseTask, deleteCaseTask } from "@/lib/actions/case-tasks";
import { formatDeadlineUrgency } from "@/lib/case-deadlines";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";
import type { CaseTaskWithRelations, CaseWithRelations } from "@/types/database";

interface CaseTasksPanelProps {
  caseData: CaseWithRelations;
  tasks: CaseTaskWithRelations[];
  canManage?: boolean;
  currentUserId?: string;
}

export function CaseTasksPanel({
  caseData,
  tasks,
  canManage = false,
  currentUserId,
}: CaseTasksPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  if (tasks.length === 0 && !canManage) {
    return null;
  }

  function handleComplete(taskId: string) {
    setActionId(taskId);
    setError(null);
    startTransition(async () => {
      const result = await completeCaseTask(taskId);
      if (result.error) setError(result.error);
      else router.refresh();
      setActionId(null);
    });
  }

  function handleDelete(taskId: string) {
    setActionId(taskId);
    setError(null);
    startTransition(async () => {
      const result = await deleteCaseTask(taskId, caseData.id);
      if (result.error) setError(result.error);
      else router.refresh();
      setActionId(null);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-4" />
            المهام المخصصة
          </CardTitle>
          <CardDescription>
            مهام مُسندة لأعضاء فريق القضية مع مواعيد نهائية
          </CardDescription>
        </div>
        {canManage && (
          <CreateCaseTaskDialog
            cases={[caseData]}
            defaultCaseId={caseData.id}
            triggerLabel="إسناد مهمة"
          />
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {tasks.length === 0 ? (
          <div className="text-muted-foreground rounded-lg border border-dashed py-10 text-center text-sm">
            لا توجد مهام مخصصة لهذه القضية بعد
          </div>
        ) : (
          <ul className="divide-y rounded-lg border">
            {tasks.map((task) => {
              const daysUntil = Math.round(
                (new Date(task.due_date).setHours(0, 0, 0, 0) -
                  new Date(today).setHours(0, 0, 0, 0)) /
                  (1000 * 60 * 60 * 24)
              );
              const isPastDue =
                task.status === "pending" && daysUntil < 0;
              const isMine = currentUserId === task.assigned_to;

              return (
                <li
                  key={task.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{task.title}</p>
                      <Badge
                        variant={
                          task.status === "completed" ? "secondary" : "outline"
                        }
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
                      <p className="text-muted-foreground text-sm">
                        {task.description}
                      </p>
                    )}

                    <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      <span>
                        المكلّف: {task.assignee?.full_name ?? "—"}
                        {task.assignee?.role
                          ? ` (${USER_ROLE_LABELS[task.assignee.role]})`
                          : ""}
                      </span>
                      <span>
                        الموعد: {formatDate(task.due_date)}
                        {task.status === "pending" &&
                          ` — ${formatDeadlineUrgency(daysUntil)}`}
                      </span>
                      {task.status === "completed" && task.completed_at && (
                        <span>أُنجزت: {formatDate(task.completed_at)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {task.status === "pending" && isMine && (
                      <Button
                        size="sm"
                        loading={isPending && actionId === task.id}
                        disabled={isPending && actionId !== task.id}
                        onClick={() => handleComplete(task.id)}
                      >
                        <CheckCircle2 className="size-4" />
                        تم الإنجاز
                      </Button>
                    )}
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={isPending && actionId === task.id}
                        disabled={isPending && actionId !== task.id}
                        onClick={() => handleDelete(task.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
