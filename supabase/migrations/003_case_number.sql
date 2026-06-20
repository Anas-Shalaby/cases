-- Case number: manual entry by user (unique, required)
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS case_number TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);

-- Backfill only if empty (placeholder — edit in app)
UPDATE cases
SET case_number = 'TEMP-' || LEFT(id::text, 8)
WHERE case_number IS NULL OR TRIM(case_number) = '';

ALTER TABLE cases
ALTER COLUMN case_number SET NOT NULL;
