-- Add initial_report_feedback_received_at to cases table
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS initial_report_feedback_received_at timestamptz;
