-- Add documents_received_at to cases table
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS documents_received_at timestamptz;
