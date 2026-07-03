-- ملاحظات القضية + أرقام هواتف وبريد متعددة لكل طرف ووكيله
ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE case_parties
    ADD COLUMN IF NOT EXISTS phones TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS emails TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS agent_phones TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS agent_emails TEXT[] NOT NULL DEFAULT '{}';

UPDATE case_parties
SET phones = ARRAY[phone]
WHERE phone IS NOT NULL
  AND TRIM(phone) <> ''
  AND phones = '{}';

UPDATE case_parties
SET emails = ARRAY[email]
WHERE email IS NOT NULL
  AND TRIM(email) <> ''
  AND emails = '{}';

UPDATE case_parties
SET agent_phones = ARRAY[agent_phone]
WHERE agent_phone IS NOT NULL
  AND TRIM(agent_phone) <> ''
  AND agent_phones = '{}';

UPDATE case_parties
SET agent_emails = ARRAY[agent_email]
WHERE agent_email IS NOT NULL
  AND TRIM(agent_email) <> ''
  AND agent_emails = '{}';

ALTER TABLE case_parties
    DROP COLUMN IF EXISTS phone,
    DROP COLUMN IF EXISTS email,
    DROP COLUMN IF EXISTS agent_phone,
    DROP COLUMN IF EXISTS agent_email;
