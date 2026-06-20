-- رقم القضية يُدخله المستخدم يدوياً — إزالة التوليد التلقائي

DROP TRIGGER IF EXISTS set_case_number ON cases;
DROP FUNCTION IF EXISTS public.generate_case_number();
DROP SEQUENCE IF EXISTS case_number_seq;

-- تأكد من وجود العمود (للمشاريع التي لم تشغّل 003 بعد)
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS case_number TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);

-- القضايا بدون رقم: ضع placeholder مؤقت يمكن تعديله لاحقاً
UPDATE cases
SET case_number = 'TEMP-' || LEFT(id::text, 8)
WHERE case_number IS NULL OR TRIM(case_number) = '';

ALTER TABLE cases
ALTER COLUMN case_number SET NOT NULL;
