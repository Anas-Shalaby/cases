"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

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
import { deleteExpertEmailLog } from "@/lib/actions/expert-email-logs";

interface DeleteEmailLogDialogProps {
  logId: string;
  expertName: string;
}

export function DeleteEmailLogDialog({
  logId,
  expertName,
}: DeleteEmailLogDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteExpertEmailLog(logId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="icon-sm">
            <Trash2 className="size-3.5" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>حذف السجل</DialogTitle>
          <DialogDescription>
            هل أنت متأكد من حذف سجل البريد الإلكتروني الخاص بـ{" "}
            <span className="font-semibold text-foreground">{expertName}</span>؟
            لا يمكن التراجع عن هذا الإجراء.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-start">
          <Button
            variant="destructive"
            loading={isPending}
            onClick={handleDelete}
          >
            <Trash2 className="size-4" />
            حذف
          </Button>
          <Button
            variant="ghost"
            disabled={isPending}
            onClick={() => setOpen(false)}
          >
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
