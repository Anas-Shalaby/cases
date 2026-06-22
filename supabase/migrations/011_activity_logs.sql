-- =============================================================================
-- Activity Logs — سجل الأنشطة (للمنسقين فقط)
-- =============================================================================

CREATE TYPE log_action_type AS ENUM (
    'create_case',
    'update_case',
    'delete_case',
    'create_user',
    'upload_document'
);

CREATE TABLE activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action_type log_action_type NOT NULL,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX idx_activity_logs_case_id ON activity_logs(case_id);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_logs_select_coordinators"
    ON activity_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'coordinator'
        )
    );

CREATE POLICY "activity_logs_insert_coordinators"
    ON activity_logs FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'coordinator'
        )
    );
