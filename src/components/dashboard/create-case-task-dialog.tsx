"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Plus, UserPlus } from "lucide-react";

import { CaseTeamMemberSelect } from "@/components/cases/case-team-member-select";
import { createCaseTask } from "@/lib/actions/case-tasks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CaseWithRelations } from "@/types/database";

interface CreateCaseTaskDialogProps {
  cases: CaseWithRelations[];
  defaultCaseId?: string;
  triggerLabel?: string;
}

export function CreateCaseTaskDialog({
  cases,
  defaultCaseId,
  triggerLabel = "إسناد مهمة",
}: CreateCaseTaskDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [caseId, setCaseId] = useState(defaultCaseId ?? "");
  const [assignedTo, setAssignedTo] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const activeCases = useMemo(
    () => cases.filter((caseItem) => caseItem.status !== "closed"),
    [cases]
  );

  const selectedCase = useMemo(
    () => activeCases.find((caseItem) => caseItem.id === caseId) ?? null,
    [activeCases, caseId]
  );

  function resetForm() {
    setCaseId(defaultCaseId ?? "");
    setAssignedTo("");
    setTitle("");
    setDescription("");
    setDueDate("");
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) resetForm();
    else if (defaultCaseId) setCaseId(defaultCaseId);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createCaseTask({
        case_id: caseId,
        assigned_to: assignedTo,
        title,
        description,
        due_date: dueDate,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setOpen(false);
      resetForm();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button size="sm">
            <UserPlus className="size-4" />
            {triggerLabel}
          </Button>
        }
      />
      <DialogContent className="max-w-lg overflow-visible sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>إسناد مهمة مخصصة</DialogTitle>
          <DialogDescription>
            حدّد القضية والمكلّف وما المطلوب إنجازه قبل الموعد النهائي
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {!defaultCaseId && (
            <div className="space-y-2">
              <Label htmlFor="task-case">القضية *</Label>
              <Select
                value={caseId}
                onValueChange={(value) => {
                  setCaseId(value ?? "");
                  setAssignedTo("");
                }}
                disabled={isPending}
              >
                <SelectTrigger id="task-case" className="w-full">
                  <SelectValue placeholder="اختر القضية" />
                </SelectTrigger>
                <SelectContent>
                  {activeCases.map((caseItem) => (
                    <SelectItem key={caseItem.id} value={caseItem.id}>
                      {caseItem.case_name} ({caseItem.case_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="task-assignee">المكلّف بالمهمة *</Label>
            <CaseTeamMemberSelect
              id="task-assignee"
              caseData={selectedCase}
              value={assignedTo}
              onValueChange={setAssignedTo}
              disabled={isPending || !caseId}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-title">المطلوب *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: النظر في القضية وتقديم تقرير مبدئي"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">تفاصيل إضافية</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="أي تعليمات أو ملاحظات للمكلّف"
              rows={3}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-due-date">الموعد النهائي *</Label>
            <Input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          <DialogFooter className="gap-2 sm:justify-start">
            <Button type="submit" loading={isPending}>
              <Plus className="size-4" />
              إرسال المهمة
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
