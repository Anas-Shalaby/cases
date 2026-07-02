-- Multiple plaintiffs/defendants per case with agent contact info
CREATE TYPE case_party_type AS ENUM ('plaintiff', 'defendant');

CREATE TABLE case_parties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    party_type case_party_type NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    agent_name TEXT,
    agent_phone TEXT,
    agent_email TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_case_parties_case_id ON case_parties(case_id);
CREATE INDEX idx_case_parties_case_type ON case_parties(case_id, party_type, sort_order);

-- Migrate existing single-party data
INSERT INTO case_parties (case_id, party_type, name, phone, email, sort_order)
SELECT id, 'plaintiff', plaintiff_name, plaintiff_phone, plaintiff_email, 0
FROM cases
WHERE plaintiff_name IS NOT NULL AND TRIM(plaintiff_name) <> '';

INSERT INTO case_parties (case_id, party_type, name, phone, email, sort_order)
SELECT id, 'defendant', defendant_name, defendant_phone, defendant_email, 0
FROM cases
WHERE defendant_name IS NOT NULL AND TRIM(defendant_name) <> '';

ALTER TABLE cases
    DROP COLUMN plaintiff_name,
    DROP COLUMN plaintiff_phone,
    DROP COLUMN plaintiff_email,
    DROP COLUMN defendant_name,
    DROP COLUMN defendant_phone,
    DROP COLUMN defendant_email;

-- Row Level Security
ALTER TABLE case_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "case_parties_select_assigned_or_coordinator"
    ON case_parties FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM cases c
            WHERE c.id = case_parties.case_id
            AND (
                public.get_user_role() = 'coordinator'
                OR c.coordinator_id = auth.uid()
                OR c.expert_id = auth.uid()
                OR c.assistant_id = auth.uid()
            )
        )
    );

CREATE POLICY "case_parties_insert_coordinator"
    ON case_parties FOR INSERT
    TO authenticated
    WITH CHECK (public.get_user_role() = 'coordinator');

CREATE POLICY "case_parties_update_coordinator"
    ON case_parties FOR UPDATE
    TO authenticated
    USING (public.get_user_role() = 'coordinator')
    WITH CHECK (public.get_user_role() = 'coordinator');

CREATE POLICY "case_parties_delete_coordinator"
    ON case_parties FOR DELETE
    TO authenticated
    USING (public.get_user_role() = 'coordinator');
