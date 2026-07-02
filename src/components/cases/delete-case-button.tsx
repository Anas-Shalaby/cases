"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { deleteCase } from "@/lib/actions/cases";
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

interface DeleteCaseButtonProps {
  caseId: string;
}

export function DeleteCaseButton({ caseId }: DeleteCaseButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      await deleteCase(caseId);
    });
  }

  function handleOpenChange(next: boolean) {
    if (isPending) return;
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="destructive"
            className="flex-1 sm:flex-none"
            disabled={isPending}
          >
            <Trash2 className="size-4" />
            حذف
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تأكيد حذف القضية</DialogTitle>
          <DialogDescription>
            هل أنت متأكد من حذف هذه القضية؟ لا يمكن التراجع عن هذا الإجراء.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => setOpen(false)}
          >
            إلغاء
          </Button>
          <Button variant="destructive" onClick={handleDelete} loading={isPending}>
            تأكيد الحذف
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
