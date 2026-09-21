"use client";

import { Check, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateCaseSituation } from "@/lib/actions/case-situation";
import { emptySituation } from "@/lib/validations/case-situation";
import { cn } from "@/lib/utils";

interface InlineSituationEditorProps {
  caseId: string;
  initialValue: string | null;
  canEdit?: boolean;
  compact?: boolean;
  onUpdated?: (newValue: string | null) => void;
  className?: string;
}

export function InlineSituationEditor({
  caseId,
  initialValue,
  canEdit = false,
  compact = false,
  onUpdated,
  className,
}: InlineSituationEditorProps) {
  const router = useRouter();
  const [displayValue, setDisplayValue] = useState(initialValue);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialValue ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!editing) {
      setDisplayValue(initialValue);
      setDraft(initialValue ?? "");
    }
  }, [initialValue, editing]);

  function startEdit() {
    setDraft(displayValue ?? "");
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(displayValue ?? "");
    setError(null);
    setEditing(false);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateCaseSituation(caseId, draft);
      if (result.error) {
        const err = result.error as Record<string, string[] | undefined>;
        setError(err._form?.[0] ?? err.situation?.[0] ?? "تعذر حفظ موقف القضية");
        return;
      }
      const normalized = emptySituation(draft);
      setDisplayValue(normalized);
      onUpdated?.(normalized);
      setEditing(false);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className={cn("space-y-2 min-w-[180px]", className)}>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={compact ? 2 : 3}
          disabled={isPending}
          placeholder="اكتب موقف القضية..."
          className="resize-y text-sm"
          autoFocus
        />
        {error && <p className="text-destructive text-xs">{error}</p>}
        <div className="flex items-center gap-1">
          <Button type="button" size="sm" onClick={save} loading={isPending} disabled={isPending}>
            <Check className="size-4" />
            حفظ
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={cancelEdit} disabled={isPending}>
            <X className="size-4" />
            إلغاء
          </Button>
        </div>
      </div>
    );
  }

  const trimmed = displayValue?.trim();

  return (
    <div className={cn("group flex items-start gap-1.5 min-w-0", className)}>
      <span
        className={cn(
          "flex-1 text-sm leading-snug whitespace-pre-wrap break-words",
          compact ? "line-clamp-3" : "line-clamp-2",
          !trimmed && "text-muted-foreground"
        )}
        title={trimmed || undefined}
      >
        {trimmed || "—"}
      </span>
      {canEdit && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
          onClick={startEdit}
          aria-label="تعديل موقف القضية"
          title="تعديل موقف القضية"
        >
          <Pencil className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
