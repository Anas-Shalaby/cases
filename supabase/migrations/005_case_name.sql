-- اسم القضية — يُدخله المستخدم يدوياً
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS case_name TEXT;

UPDATE cases
SET case_name = TRIM(plaintiff_name || ' ضد ' || defendant_name)
WHERE case_name IS NULL OR TRIM(case_name) = '';

ALTER TABLE cases
ALTER COLUMN case_name SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cases_case_name ON cases(case_name);
