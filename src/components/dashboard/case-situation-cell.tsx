"use client";

import { Check, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { updateCaseSituation } from "@/lib/actions/case-situation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface CaseSituationCellProps {
  caseId: string;
  value: string | null;
  canEdit: boolean;
  className?: string;
}

export function CaseSituationCell({
  caseId,
  value,
  canEdit,
  className,
}: CaseSituationCellProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!editing) {
      setText(value ?? "");
    }
  }, [value, editing]);

  function startEditing() {
    setText(value ?? "");
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setText(value ?? "");
    setError(null);
    setEditing(false);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateCaseSituation(caseId, text);
      if (result.error) {
        const err = result.error as Record<string, string[] | undefined>;
        setError(
          err._form?.[0] ??
            err.situation?.[0] ??
            "تعذر حفظ موقف القضية"
        );
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className={cn("space-y-2", className)}>
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          disabled={isPending}
          placeholder="اكتب آخر موقف للقضية..."
          className="min-w-[220px] resize-y"
        />
        {error && <p className="text-destructive text-xs">{error}</p>}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            onClick={save}
            loading={isPending}
            disabled={isPending}
          >
            <Check className="size-4" />
            حفظ
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={cancelEditing}
            disabled={isPending}
          >
            <X className="size-4" />
            إلغاء
          </Button>
        </div>
      </div>
    );
  }

  const display = value?.trim();

  return (
    <div className={cn("group min-w-[220px] space-y-1", className)}>
      <div className="flex items-start gap-2">
        <p
          className={cn(
            "flex-1 text-sm leading-relaxed whitespace-pre-wrap",
            !display && "text-muted-foreground"
          )}
        >
          {display || "—"}
        </p>
        {canEdit && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="shrink-0 opacity-70 group-hover:opacity-100"
            onClick={startEditing}
            aria-label="تعديل موقف القضية"
          >
            <Pencil className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
