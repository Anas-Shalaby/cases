-- Restrict case updates to coordinators only (experts/assistants: view only)
DROP POLICY IF EXISTS "cases_update_assigned_or_coordinator" ON cases;

CREATE POLICY "cases_update_coordinator_only"
    ON cases FOR UPDATE
    TO authenticated
    USING (public.get_user_role() = 'coordinator')
    WITH CHECK (public.get_user_role() = 'coordinator');

-- Restrict document uploads to coordinators only
DROP POLICY IF EXISTS "case_documents_insert_team" ON case_documents;

CREATE POLICY "case_documents_insert_coordinator"
    ON case_documents FOR INSERT
    TO authenticated
    WITH CHECK (public.get_user_role() = 'coordinator');
