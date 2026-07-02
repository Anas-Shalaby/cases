-- =============================================================================
-- موعد الاجتماع باليوم والساعة (TIMESTAMPTZ)
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'cases'
    ) THEN
        RAISE EXCEPTION 'يجب تنفيذ migrations السابقة قبل تشغيل 018';
    END IF;
END $$;

ALTER TABLE cases
    ALTER COLUMN meeting_date TYPE TIMESTAMPTZ
    USING CASE
        WHEN meeting_date IS NOT NULL
        THEN (meeting_date::text || ' 12:00:00+00')::timestamptz
        ELSE NULL
    END;

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
    FOR r IN
        SELECT id, case_number, case_name, meeting_date,
               initial_report_date, final_report_date, status
        FROM cases
        WHERE status != 'closed'
    LOOP
        IF r.meeting_date IS NOT NULL THEN
            days_until := (r.meeting_date AT TIME ZONE 'UTC')::date - CURRENT_DATE;
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
                    v_title := 'تأخر التقرير المبدئي';
                    v_message := 'تجاوز موعد التقرير المبدئي للقضية ' || r.case_number || ' — ' || r.case_name || '.';
                ELSIF days_until = 0 THEN
                    v_title := 'موعد التقرير المبدئي اليوم';
                    v_message := 'موعد التقرير المبدئي للقضية ' || r.case_number || ' — ' || r.case_name || ' اليوم.';
                ELSIF days_until = 1 THEN
                    v_title := 'تذكير: التقرير المبدئي غداً';
                    v_message := 'موعد التقرير المبدئي للقضية ' || r.case_number || ' غداً.';
                ELSE
                    v_title := 'تذكير: التقرير المبدئي قريب';
                    v_message := 'موعد التقرير المبدئي للقضية ' || r.case_number || ' خلال ' || days_until || ' أيام.';
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
                    v_message := 'تجاوز موعد التقرير النهائي للقضية ' || r.case_number || ' — ' || r.case_name || '.';
                ELSIF days_until = 0 THEN
                    v_title := 'موعد التقرير النهائي اليوم';
                    v_message := 'موعد التقرير النهائي للقضية ' || r.case_number || ' — ' || r.case_name || ' اليوم.';
                ELSIF days_until = 1 THEN
                    v_title := 'تذكير: التقرير النهائي غداً';
                    v_message := 'موعد التقرير النهائي للقضية ' || r.case_number || ' غداً.';
                ELSE
                    v_title := 'تذكير: التقرير النهائي قريب';
                    v_message := 'موعد التقرير النهائي للقضية ' || r.case_number || ' خلال ' || days_until || ' أيام.';
                END IF;
                PERFORM public.notify_case_coordinators(
                    r.id, 'report_deadline', v_title, v_message
                );
            END IF;
        END IF;
    END LOOP;
END;
$$;
