"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Pencil, Plus, Save, X } from "lucide-react";

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
import {
  createExpertEmailLog,
  updateExpertEmailLog,
} from "@/lib/actions/expert-email-logs";
import type {
  ExpertEmailLogWithExpert,
  Profile,
} from "@/types/database";

function parseActionItems(text: string): string[] {
  const items = text
    .split("\n")
    .map((s) => s.replace(/^\s*[-•●]\s*/, "").trim())
    .filter(Boolean);
  return items.length > 0 ? items : [""];
}

function joinActionItems(items: string[]): string {
  return items
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `• ${s}`)
    .join("\n");
}

interface ExpertEmailLogDialogProps {
  experts: Pick<Profile, "id" | "full_name">[];
  log?: ExpertEmailLogWithExpert;
  trigger?: React.ReactNode;
}

function todayDate() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nowTime() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ExpertEmailLogDialog({
  experts,
  log,
  trigger,
}: ExpertEmailLogDialogProps) {
  const isEdit = !!log;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [logDate, setLogDate] = useState(log?.log_date ?? todayDate());
  const [logTime, setLogTime] = useState(
    log?.log_time ? log.log_time.slice(0, 5) : nowTime()
  );
  const [lastEmailSubject, setLastEmailSubject] = useState(
    log?.last_email_subject ?? ""
  );
  const [expertId, setExpertId] = useState(log?.expert_id ?? "");
  const [actionItems, setActionItems] = useState<string[]>(
    log?.action_taken ? parseActionItems(log.action_taken) : [""]
  );

  useEffect(() => {
    if (open && log) {
      setLogDate(log.log_date);
      setLogTime(log.log_time ? log.log_time.slice(0, 5) : nowTime());
      setLastEmailSubject(log.last_email_subject);
      setExpertId(log.expert_id);
      setActionItems(log.action_taken ? parseActionItems(log.action_taken) : [""]);
    }
  }, [open, log]);

  function resetForm() {
    setLogDate(todayDate());
    setLogTime(nowTime());
    setLastEmailSubject("");
    setExpertId("");
    setActionItems([""]);
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen && !isEdit) resetForm();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const values = {
        log_date: logDate,
        log_time: logTime,
        last_email_subject: lastEmailSubject,
        expert_id: expertId,
        action_taken: joinActionItems(actionItems),
      };

      const result = isEdit
        ? await updateExpertEmailLog(log!.id, values)
        : await createExpertEmailLog(values);

      if (result.error) {
        const msg =
          "_form" in result.error
            ? result.error._form[0]
            : Object.values(result.error).flat().join("، ");
        setError(msg);
        return;
      }

      setOpen(false);
      if (!isEdit) resetForm();
      router.refresh();
    });
  }

  const selectedExpert = experts.find((e) => e.id === expertId);

  const defaultTrigger = isEdit ? (
    <Button variant="ghost" size="icon-sm">
      <Pencil className="size-3.5" />
    </Button>
  ) : (
    <Button size="sm">
      <Plus className="size-4" data-icon="inline-start" />
      إضافة سجل جديد
    </Button>
  );

  const triggerElement = (trigger ?? defaultTrigger) as React.ReactElement;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={triggerElement} />
      <DialogContent className="max-w-lg overflow-visible sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "تعديل سجل البريد" : "إضافة سجل بريد جديد"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "عدّل بيانات السجل ثم اضغط حفظ"
              : "سجّل آخر بريد إلكتروني تم استلامه من الخبير وما تم بشأنه"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="email-log-date">اليوم *</Label>
              <Input
                id="email-log-date"
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-log-time">الساعة *</Label>
              <Input
                id="email-log-time"
                type="time"
                value={logTime}
                onChange={(e) => setLogTime(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-log-expert">المرسل (الخبير) *</Label>
            <Select
              value={expertId}
              onValueChange={(value) => setExpertId(value ?? "")}
              disabled={isPending}
            >
              <SelectTrigger id="email-log-expert" className="w-full">
                {expertId && selectedExpert ? (
                  selectedExpert.full_name
                ) : (
                  <SelectValue placeholder="اختر الخبير" />
                )}
              </SelectTrigger>
              <SelectContent>
                {experts.map((expert) => (
                  <SelectItem key={expert.id} value={expert.id}>
                    {expert.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-log-subject">آخر بريد إلكتروني *</Label>
            <Textarea
              id="email-log-subject"
              value={lastEmailSubject}
              onChange={(e) => setLastEmailSubject(e.target.value)}
              placeholder="موضوع أو ملخص البريد الإلكتروني الأخير"
              rows={3}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>ما قد تم بالفعل لليوم</Label>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={isPending}
                onClick={() => setActionItems([...actionItems, ""])}
              >
                <Plus className="size-3" />
                إضافة بند
              </Button>
            </div>
            <div className="space-y-2">
              {actionItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground w-5 shrink-0 text-center">
                    {idx + 1}
                  </span>
                  <Input
                    value={item}
                    onChange={(e) => {
                      const updated = [...actionItems];
                      updated[idx] = e.target.value;
                      setActionItems(updated);
                    }}
                    placeholder={`البند ${idx + 1}`}
                    disabled={isPending}
                  />
                  {actionItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={isPending}
                      onClick={() =>
                        setActionItems(actionItems.filter((_, i) => i !== idx))
                      }
                    >
                      <X className="size-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-start">
            <Button type="submit" loading={isPending}>
              {isEdit ? (
                <>
                  <Save className="size-4" />
                  حفظ التعديلات
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  إضافة
                </>
              )}
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
