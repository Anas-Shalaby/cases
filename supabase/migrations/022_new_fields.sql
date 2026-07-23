-- =============================================================================
-- إضافة مراحل جديدة + حقل نوع القضية + تاريخ اجتماع القضاة
-- =============================================================================

-- 1) مراحل إنجاز جديدة (3 مراحل قبل اجتماع الخبراء)
ALTER TABLE cases ADD COLUMN IF NOT EXISTS summary_memo_uploaded_at DATE;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS experts_notified_at DATE;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS post_parties_invitation_at DATE;

-- 2) نوع القضية: فردي أو لجنة
DO $$ BEGIN
  CREATE TYPE case_type AS ENUM ('individual', 'committee');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_type case_type NOT NULL DEFAULT 'individual';

-- 3) تاريخ اجتماع القضاة
ALTER TABLE cases ADD COLUMN IF NOT EXISTS judges_meeting_date DATE;
