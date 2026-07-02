-- Log sent meeting reminder emails (one per case per meeting date)
-- Requires: migrations 001–015 (جدول cases و profiles)

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'cases'
    ) THEN
        RAISE EXCEPTION 'جدول cases غير موجود. نفّذ migrations من 001_initial_schema.sql حتى 015_case_parties.sql أولاً على نفس مشروع Supabase.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) THEN
        RAISE EXCEPTION 'جدول profiles غير موجود. نفّذ 001_initial_schema.sql أولاً.';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS meeting_reminder_email_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    coordinator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    meeting_date DATE NOT NULL,
    recipient_email TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT meeting_reminder_email_log_unique UNIQUE (case_id, meeting_date)
);

CREATE INDEX IF NOT EXISTS idx_meeting_reminder_email_log_sent_at
    ON meeting_reminder_email_log(sent_at DESC);

ALTER TABLE meeting_reminder_email_log ENABLE ROW LEVEL SECURITY;

-- No policies: only service role (server) accesses this table
