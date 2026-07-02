"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Download, FileText, Plus, Trash2 } from "lucide-react";

import {
  addCaseDocument,
  deleteCaseDocument,
  getDocumentDownloadUrl,
} from "@/lib/actions/case-documents";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import type { CaseDocument } from "@/types/database";

interface CaseDocumentsPanelProps {
  caseId: string;
  documents: CaseDocument[];
  canManage?: boolean;
}

export function CaseDocumentsPanel({
  caseId,
  documents,
  canManage = false,
}: CaseDocumentsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await addCaseDocument(caseId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setShowForm(false);
      e.currentTarget.reset();
      router.refresh();
    });
  }

  function handleDelete(documentId: string) {
    setDeletingId(documentId);
    startTransition(async () => {
      const result = await deleteCaseDocument(documentId, caseId);
      if (result.error) setError(result.error);
      else router.refresh();
      setDeletingId(null);
    });
  }

  async function handleDownload(documentId: string, filePath: string) {
    setDownloadingId(documentId);
    setError(null);
    try {
      const url = await getDocumentDownloadUrl(filePath);
      if (url) window.open(url, "_blank");
      else setError("تعذّر تحميل الملف");
    } finally {
      setDownloadingId(null);
    }
  }

  const isBusy = isPending || downloadingId !== null || deletingId !== null;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>مستندات القضية</CardTitle>
          <CardDescription>
            المرفقات والوثائق المرتبطة بالقضية
          </CardDescription>
        </div>
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            disabled={isBusy}
            onClick={() => setShowForm((v) => !v)}
          >
            <Plus className="size-4" />
            إرفاق مستند
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {showForm && canManage && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-lg border bg-muted/30 p-4"
          >
            <div className="space-y-2">
              <Label htmlFor="doc-title">عنوان المستند *</Label>
              <Input
                id="doc-title"
                name="title"
                placeholder="مثال: مذكرة الدفاع"
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-file">الملف (اختياري)</Label>
              <Input
                id="doc-file"
                name="file"
                type="file"
                disabled={isPending}
                className="text-sm"
              />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="submit" loading={isPending} className="sm:flex-1">
                حفظ المستند
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                onClick={() => setShowForm(false)}
              >
                إلغاء
              </Button>
            </div>
          </form>
        )}

        {documents.length === 0 ? (
          <div className="text-muted-foreground rounded-lg border border-dashed py-10 text-center text-sm">
            لا توجد مستندات مرفقة بعد
          </div>
        ) : (
          <ul className="divide-y rounded-lg border">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <FileText className="text-muted-foreground size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{doc.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {doc.uploader?.full_name ?? "—"} ·{" "}
                      {formatDate(doc.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {doc.file_path && (
                    <Button
                      variant="outline"
                      size="sm"
                      loading={downloadingId === doc.id}
                      disabled={isBusy && downloadingId !== doc.id}
                      onClick={() => handleDownload(doc.id, doc.file_path!)}
                    >
                      <Download className="size-4" />
                      تحميل
                    </Button>
                  )}
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={deletingId === doc.id}
                      disabled={isBusy && deletingId !== doc.id}
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
