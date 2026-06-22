"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/actions/activity-logs";
import { requireCoordinator } from "@/lib/auth/require-coordinator";
import type { CaseDocument } from "@/types/database";

const documentSchema = z.object({
  title: z.string().min(1, "عنوان المستند مطلوب").max(200),
});

export async function getCaseDocuments(
  caseId: string
): Promise<CaseDocument[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("case_documents")
    .select(
      `
      *,
      uploader:profiles!case_documents_uploaded_by_fkey(id, full_name)
    `
    )
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as CaseDocument[];
}

export async function addCaseDocument(
  caseId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const auth = await requireCoordinator();
  if ("error" in auth) return { error: auth.error._form[0] };

  const profile = auth.profile;

  const parsed = documentSchema.safeParse({
    title: formData.get("title"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const supabase = await createClient();
  let filePath: string | null = null;

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const ext = file.name.split(".").pop() ?? "bin";
    const storagePath = `${caseId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("case-documents")
      .upload(storagePath, file, { upsert: false });

    if (uploadError) {
      return {
        error:
          uploadError.message.includes("Bucket not found")
            ? "لم يُعثر على مساحة التخزين. أنشئ bucket باسم case-documents في Supabase."
            : uploadError.message,
      };
    }
    filePath = storagePath;
  }

  const { error } = await supabase.from("case_documents").insert({
    case_id: caseId,
    title: parsed.data.title,
    file_path: filePath,
    uploaded_by: profile.id,
  });

  if (error) return { error: error.message };

  const { data: caseRow } = await supabase
    .from("cases")
    .select("case_number, case_name")
    .eq("id", caseId)
    .single();

  await logActivity({
    userId: profile.id,
    actionType: "upload_document",
    caseId,
    description: `أرفق مستنداً «${parsed.data.title}» على القضية ${caseRow?.case_number ?? ""} — ${caseRow?.case_name ?? ""}`,
    metadata: {
      document_title: parsed.data.title,
      file_path: filePath,
      case_number: caseRow?.case_number,
    },
  });

  revalidatePath(`/cases/${caseId}`);
  revalidatePath("/activity-logs");
  return {};
}

export async function deleteCaseDocument(
  documentId: string,
  caseId: string
): Promise<{ error?: string }> {
  const auth = await requireCoordinator();
  if ("error" in auth) return { error: auth.error._form[0] };

  const supabase = await createClient();

  const { data: doc } = await supabase
    .from("case_documents")
    .select("file_path")
    .eq("id", documentId)
    .single();

  const { error } = await supabase
    .from("case_documents")
    .delete()
    .eq("id", documentId);

  if (error) return { error: error.message };

  if (doc?.file_path) {
    await supabase.storage.from("case-documents").remove([doc.file_path]);
  }

  revalidatePath(`/cases/${caseId}`);
  return {};
}

export async function getDocumentDownloadUrl(
  filePath: string
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("case-documents")
    .createSignedUrl(filePath, 3600);

  return data?.signedUrl ?? null;
}
