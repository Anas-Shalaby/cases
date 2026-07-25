-- =============================================================================
-- إصلاح إشعارات التقارير المنجزة وتنبيهات الجلسة القادمة بـ 48 ساعة
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
        -- تنبيهات المواعيد: تحديث الإشعار غير المقروء المرتبط بنفس الموضوع
        IF p_type IN ('report_deadline', 'meeting_reminder') THEN
            -- مطابقة حسب موضوع العنوان تفادياً لتداخل الإشعارات المختلفة
            IF p_title LIKE '%الأولي%' THEN
                UPDATE notifications
                SET title = p_title,
                    message = p_message,
                    created_at = TIMEZONE('utc'::text, NOW())
                WHERE user_id = v_user_id
                  AND case_id = p_case_id
                  AND type = p_type
                  AND title LIKE '%الأولي%'
                  AND is_read = false;
            ELSIF p_title LIKE '%النهائي%' THEN
                UPDATE notifications
                SET title = p_title,
                    message = p_message,
                    created_at = TIMEZONE('utc'::text, NOW())
                WHERE user_id = v_user_id
                  AND case_id = p_case_id
                  AND type = p_type
                  AND title LIKE '%النهائي%'
                  AND is_read = false;
            ELSIF p_title LIKE '%جلسة%' THEN
                UPDATE notifications
                SET title = p_title,
                    message = p_message,
                    created_at = TIMEZONE('utc'::text, NOW())
                WHERE user_id = v_user_id
                  AND case_id = p_case_id
                  AND type = p_type
                  AND title LIKE '%جلسة%'
                  AND is_read = false;
            ELSIF p_title LIKE '%اجتماع%' THEN
                UPDATE notifications
                SET title = p_title,
                    message = p_message,
                    created_at = TIMEZONE('utc'::text, NOW())
                WHERE user_id = v_user_id
                  AND case_id = p_case_id
                  AND type = p_type
                  AND title LIKE '%اجتماع%'
                  AND is_read = false;
            ELSE
                UPDATE notifications
                SET title = p_title,
                    message = p_message,
                    created_at = TIMEZONE('utc'::text, NOW())
                WHERE user_id = v_user_id
                  AND case_id = p_case_id
                  AND type = p_type
                  AND is_read = false;
            END IF;

            GET DIAGNOSTICS v_updated = ROW_COUNT;
            IF v_updated > 0 THEN
                CONTINUE;
            END IF;

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

            CONTINUE;
        END IF;

        -- مستندات جديدة أو أنواع أخرى: منع التكرار في نفس اليوم
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
    v_missing_milestones TEXT;
BEGIN
    IF NOT pg_try_advisory_lock(839201) THEN
        RETURN;
    END IF;

    BEGIN
        FOR r IN
            SELECT id, case_number, case_name, meeting_date,
                initial_report_date, final_report_date, judges_meeting_date, status,
                post_parties_invitation_at, experts_notified_at, summary_memo_uploaded_at,
                initial_report_prepared_at, final_report_prepared_at
            FROM cases
            WHERE status != 'closed'
        LOOP
            -- 1) تنبيهات اجتماع الخبراء
            IF r.meeting_date IS NOT NULL THEN
                days_until := (r.meeting_date::date) - CURRENT_DATE;
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

                    -- تنبيه نواقص مراحل الاجتماع
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
                        ELSE
                            -- تنظيف إشعار النواقص إذا كانت مكتملة
                            DELETE FROM notifications
                            WHERE case_id = r.id
                              AND type = 'meeting_reminder'
                              AND title LIKE '%نواقص%';
                        END IF;
                    END IF;
                END IF;
            END IF;

            -- 2) ميعاد الجلسة القادم (يشمل التذكير قبل 48 ساعة)
            IF r.judges_meeting_date IS NOT NULL THEN
                days_until := (r.judges_meeting_date::date) - CURRENT_DATE;
                IF days_until BETWEEN 0 AND 3 THEN
                    IF days_until = 0 THEN
                        v_title := 'ميعاد الجلسة اليوم';
                        v_message := 'جلسة القضية ' || r.case_number || ' — ' || r.case_name || ' مقررة اليوم.';
                    ELSIF days_until = 1 THEN
                        v_title := 'تذكير: جلسة غداً';
                        v_message := 'جلسة القضية ' || r.case_number || ' — ' || r.case_name || ' مقرر عقدها غداً.';
                    ELSIF days_until = 2 THEN
                        v_title := 'تذكير: جلسة بعد 48 ساعة';
                        v_message := 'جلسة القضية ' || r.case_number || ' — ' || r.case_name || ' مقرر عقدها خلال 48 ساعة (بعد يومين).';
                    ELSE
                        v_title := 'تذكير: جلسة قريبة';
                        v_message := 'جلسة القضية ' || r.case_number || ' خلال ' || days_until || ' أيام.';
                    END IF;
                    PERFORM public.notify_case_coordinators(
                        r.id, 'meeting_reminder', v_title, v_message
                    );
                END IF;
            END IF;

            -- 3) التقرير الأولي (يُفحص فقط إذا لم يكن مُعدّاً بالفعل)
            IF r.initial_report_prepared_at IS NOT NULL THEN
                -- التقرير الأولي مكتمل: حذف أي تنبيهات غير مقروءة للتقرير الأولي
                DELETE FROM notifications
                WHERE case_id = r.id
                  AND type = 'report_deadline'
                  AND title LIKE '%التقرير الأولي%';
            ELSIF r.initial_report_date IS NOT NULL THEN
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

            -- 4) التقرير النهائي (يُفحص فقط إذا لم يكن مُعدّاً بالفعل)
            IF r.final_report_prepared_at IS NOT NULL THEN
                -- التقرير النهائي مكتمل: حذف أي تنبيهات غير مقروءة للتقرير النهائي
                DELETE FROM notifications
                WHERE case_id = r.id
                  AND type = 'report_deadline'
                  AND title LIKE '%التقرير النهائي%';
            ELSIF r.final_report_date IS NOT NULL THEN
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
