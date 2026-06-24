-- =============================================================================
-- منع تكرار إشعارات المواعيد لنفس المستخدم والقضية
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
    v_updated INT;
BEGIN
    FOR v_user_id IN
        SELECT id FROM profiles WHERE role = 'coordinator'
    LOOP
        -- تنبيهات المواعيد: تحديث الإشعار غير المقروء بدلاً من إنشاء نسخة جديدة
        IF p_type IN ('report_deadline', 'meeting_reminder') THEN
            UPDATE notifications
            SET title = p_title,
                message = p_message,
                created_at = TIMEZONE('utc'::text, NOW())
            WHERE user_id = v_user_id
              AND case_id = p_case_id
              AND type = p_type
              AND is_read = false;

            GET DIAGNOSTICS v_updated = ROW_COUNT;
            IF v_updated > 0 THEN
                CONTINUE;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM notifications
                WHERE user_id = v_user_id
                  AND case_id = p_case_id
                  AND type = p_type
                  AND created_at::date = CURRENT_DATE
            ) THEN
                INSERT INTO notifications (user_id, case_id, type, title, message)
                VALUES (v_user_id, p_case_id, p_type, p_title, p_message);
            END IF;

            CONTINUE;
        END IF;

        -- مستندات جديدة: منع التكرار في نفس اليوم
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

CREATE OR REPLACE FUNCTION public.sync_deadline_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r RECORD;
    days_until INT;
    v_title TEXT;
    v_message TEXT;
BEGIN
    IF NOT pg_try_advisory_lock(839201) THEN
        RETURN;
    END IF;

    BEGIN
        FOR r IN
            SELECT id, case_number, case_name, meeting_date,
                   initial_report_date, final_report_date, status
            FROM cases
            WHERE status != 'closed'
        LOOP
            IF r.meeting_date IS NOT NULL THEN
                days_until := r.meeting_date - CURRENT_DATE;
                IF days_until BETWEEN 0 AND 3 THEN
                    IF days_until = 0 THEN
                        v_title := 'اجتماع القضية اليوم';
                        v_message := 'اجتماع القضية ' || r.case_number || ' — ' || r.case_name || ' مقرر اليوم.';
                    ELSIF days_until = 1 THEN
                        v_title := 'تذكير: اجتماع غداً';
                        v_message := 'اجتماع القضية ' || r.case_number || ' — ' || r.case_name || ' غداً.';
                    ELSE
                        v_title := 'تذكير: اجتماع قريب';
                        v_message := 'اجتماع القضية ' || r.case_number || ' خلال ' || days_until || ' أيام.';
                    END IF;
                    PERFORM public.notify_case_coordinators(
                        r.id, 'meeting_reminder', v_title, v_message
                    );
                END IF;
            END IF;

            IF r.initial_report_date IS NOT NULL THEN
                days_until := r.initial_report_date - CURRENT_DATE;
                IF days_until BETWEEN -1 AND 3 THEN
                    IF days_until < 0 THEN
                        v_title := 'تأخر التقرير الأولي';
                        v_message := 'موعد التقرير الأولي للقضية ' || r.case_number || ' قد انتهى.';
                    ELSIF days_until = 0 THEN
                        v_title := 'موعد التقرير الأولي اليوم';
                        v_message := 'التقرير الأولي للقضية ' || r.case_number || ' مستحق اليوم.';
                    ELSE
                        v_title := 'اقتراب موعد التقرير الأولي';
                        v_message := 'التقرير الأولي للقضية ' || r.case_number || ' خلال ' || days_until || ' أيام.';
                    END IF;
                    PERFORM public.notify_case_coordinators(
                        r.id, 'report_deadline', v_title, v_message
                    );
                END IF;
            END IF;

            IF r.final_report_date IS NOT NULL THEN
                days_until := r.final_report_date - CURRENT_DATE;
                IF days_until BETWEEN -1 AND 3 THEN
                    IF days_until < 0 THEN
                        v_title := 'تأخر التقرير النهائي';
                        v_message := 'موعد التقرير النهائي للقضية ' || r.case_number || ' قد انتهى.';
                    ELSIF days_until = 0 THEN
                        v_title := 'موعد التقرير النهائي اليوم';
                        v_message := 'التقرير النهائي للقضية ' || r.case_number || ' مستحق اليوم.';
                    ELSE
                        v_title := 'اقتراب موعد التقرير النهائي';
                        v_message := 'التقرير النهائي للقضية ' || r.case_number || ' خلال ' || days_until || ' أيام.';
                    END IF;
                    PERFORM public.notify_case_coordinators(
                        r.id, 'report_deadline', v_title, v_message
                    );
                END IF;
            END IF;
        END LOOP;
    EXCEPTION
        WHEN OTHERS THEN
            PERFORM pg_advisory_unlock(839201);
            RAISE;
    END;

    PERFORM pg_advisory_unlock(839201);
END;
$$;

-- حذف الإشعارات المكررة غير المقروءة (الإبقاء على الأحدث)
DELETE FROM notifications n1
USING notifications n2
WHERE n1.user_id = n2.user_id
  AND n1.case_id = n2.case_id
  AND n1.type = n2.type
  AND n1.type IN ('report_deadline', 'meeting_reminder')
  AND n1.is_read = false
  AND n2.is_read = false
  AND n1.created_at < n2.created_at;
