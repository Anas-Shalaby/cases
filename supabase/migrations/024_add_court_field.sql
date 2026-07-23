-- =============================================================================
-- إضافة حقل المحكمة (court)
-- =============================================================================

CREATE TYPE court_type AS ENUM ('dubai', 'abu_dhabi', 'federal');

ALTER TABLE cases
ADD COLUMN court court_type;
