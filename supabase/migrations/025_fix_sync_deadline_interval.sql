-- =============================================================================
-- إصلاح خطأ `invalid input syntax for type integer` في مزامنة الإشعارات
-- المشكلة: طرح `timestamp` من `date` ينتج عنه `interval` وليس `integer`
-- الحل: تحويل التواريخ إلى `date` قبل عملية الطرح
-- =============================================================================

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
    v_missing_milestones TEXT;
BEGIN
    IF NOT pg_try_advisory_lock(839201) THEN
        RETURN;
    END IF;

    BEGIN
        FOR r IN
            SELECT id, case_number, case_name, meeting_date,
                initial_report_date, final_report_date, status,
                post_parties_invitation_at, experts_notified_at, summary_memo_uploaded_at
            FROM cases
            WHERE status != 'closed'
        LOOP
            -- تنبيهات الاجتماع
            IF r.meeting_date IS NOT NULL THEN
                days_until := (r.meeting_date::date) - CURRENT_DATE;
                IF days_until BETWEEN 0 AND 3 THEN
                    -- تذكير بموعد الاجتماع
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

                    -- تنبيه 48 ساعة لنواقص مراحل الاجتماع
                    IF days_until <= 2 THEN
                        v_missing_milestones := '';
                        IF r.post_parties_invitation_at IS NULL THEN
                            v_missing_milestones := v_missing_milestones || 'بعد دعوة الأطراف، ';
                        END IF;
                        IF r.experts_notified_at IS NULL THEN
                            v_missing_milestones := v_missing_milestones || 'إبلاغ لجنة الخبراء، ';
                        END IF;
                        IF r.summary_memo_uploaded_at IS NULL THEN
                            v_missing_milestones := v_missing_milestones || 'رفع المذكرة المختصرة، ';
                        END IF;

                        IF length(v_missing_milestones) > 0 THEN
                            v_missing_milestones := trim(trailing '، ' from v_missing_milestones);
                            v_title := 'نواقص قبل الاجتماع';
                            v_message := 'القضية ' || r.case_number || ' يقترب اجتماعها ويوجد مراحل غير منجزة: ' || v_missing_milestones;
                            PERFORM public.notify_case_coordinators(
                                r.id, 'meeting_reminder', v_title, v_message
                            );
                        END IF;
                    END IF;
                END IF;
            END IF;

            -- التقرير الأولي
            IF r.initial_report_date IS NOT NULL THEN
                days_until := (r.initial_report_date::date) - CURRENT_DATE;
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

            -- التقرير النهائي
            IF r.final_report_date IS NOT NULL THEN
                days_until := (r.final_report_date::date) - CURRENT_DATE;
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
