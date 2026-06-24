-- =============================================================================
-- إرسال تنبيهات القضايا لجميع المنسقين (وليس المنسق المُعيَّن فقط)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.notify_case_coordinators(
    p_case_id UUID,
    p_type notification_type,
    p_title TEXT,
    p_message TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    FOR v_user_id IN
        SELECT id FROM profiles WHERE role = 'coordinator'
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM notifications
            WHERE user_id = v_user_id
              AND case_id = p_case_id
              AND type = p_type
              AND title = p_title
              AND created_at::date = CURRENT_DATE
        ) THEN
            INSERT INTO notifications (user_id, case_id, type, title, message)
            VALUES (v_user_id, p_case_id, p_type, p_title, p_message);
        END IF;
    END LOOP;
END;
$$;

-- نسخ التنبيهات الحالية (المواعيد والمستندات) لبقية المنسقين
INSERT INTO notifications (user_id, case_id, type, title, message, is_read, created_at)
SELECT
    c.id,
    n.case_id,
    n.type,
    n.title,
    n.message,
    false,
    n.created_at
FROM notifications n
CROSS JOIN profiles c
WHERE c.role = 'coordinator'
  AND n.type IN ('report_deadline', 'meeting_reminder', 'new_document')
  AND n.user_id IS DISTINCT FROM c.id
  AND NOT EXISTS (
      SELECT 1
      FROM notifications n2
      WHERE n2.user_id = c.id
        AND n2.case_id = n.case_id
        AND n2.type = n.type
        AND n2.title = n.title
        AND n2.created_at::date = n.created_at::date
  );
