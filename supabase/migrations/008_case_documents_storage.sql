-- =============================================================================
-- Supabase Storage: case-documents bucket (optional — for file attachments)
-- Create bucket in Dashboard → Storage → New bucket: "case-documents" (private)
-- Or run the statements below if storage schema is available.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('case-documents', 'case-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "case_documents_storage_select"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'case-documents'
        AND EXISTS (
            SELECT 1 FROM case_documents cd
            JOIN cases c ON c.id = cd.case_id
            WHERE cd.file_path = name
              AND (
                  public.get_user_role() = 'coordinator'
                  OR c.coordinator_id = auth.uid()
                  OR c.expert_id = auth.uid()
                  OR c.assistant_id = auth.uid()
              )
        )
    );

CREATE POLICY "case_documents_storage_insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'case-documents'
        AND (storage.foldername(name))[1] IS NOT NULL
    );

CREATE POLICY "case_documents_storage_delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'case-documents'
        AND public.get_user_role() = 'coordinator'
    );
