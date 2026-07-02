"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteTeamMember } from "@/lib/actions/manage-users";
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

interface DeleteTeamMemberButtonProps {
  userId: string;
  userName: string;
}

export function DeleteTeamMemberButton({
  userId,
  userName,
}: DeleteTeamMemberButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteTeamMember(userId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
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
            variant="ghost"
            size="icon-xs"
            className="text-destructive hover:text-destructive"
            title="حذف"
            disabled={isPending}
          >
            <Trash2 className="size-3.5" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تأكيد حذف العضو</DialogTitle>
          <DialogDescription>
            هل أنت متأكد من حذف <strong>{userName}</strong>؟ سيتم إلغاء ربطه
            بالقضايا المرتبطة ولا يمكن التراجع عن هذا الإجراء.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
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
