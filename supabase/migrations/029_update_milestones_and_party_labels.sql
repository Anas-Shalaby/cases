-- =============================================================================
-- Update case milestones and party labels
-- =============================================================================

-- 1. Add custom_label to case_parties
ALTER TABLE case_parties
    ADD COLUMN IF NOT EXISTS custom_label TEXT;

-- 2. Drop old milestones and add new ones (TIMESTAMP WITH TIME ZONE for time support)
ALTER TABLE cases
    DROP COLUMN IF EXISTS defendant_documents_received_at,
    DROP COLUMN IF EXISTS plaintiff_documents_received_at,
    ADD COLUMN IF NOT EXISTS documents_submission_deadline_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS initial_report_feedback_deadline_at TIMESTAMP WITH TIME ZONE;

-- 3. Update sync_deadline_notifications to include the new deadline reminders
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
                initial_report_prepared_at, final_report_prepared_at,
                documents_submission_deadline_at, initial_report_feedback_deadline_at
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

            -- 4) إلغاء تنبيهات التقرير النهائي بالكامل وحذف أي إشعارات مرسلة سابقة له
            DELETE FROM notifications
            WHERE case_id = r.id
              AND type = 'report_deadline'
              AND title LIKE '%التقرير النهائي%';

            -- 5) مهلة تقديم المستندات (تذكير قبل 24 ساعة)
            IF r.documents_submission_deadline_at IS NOT NULL THEN
                days_until := (r.documents_submission_deadline_at::date) - CURRENT_DATE;
                IF days_until BETWEEN 0 AND 1 THEN
                    IF days_until = 0 THEN
                        v_title := 'مهلة تقديم المستندات تنتهي اليوم';
                        v_message := 'مهلة تقديم المستندات للقضية ' || r.case_number || ' تنتهي اليوم.';
                    ELSIF days_until = 1 THEN
                        v_title := 'تذكير: مهلة تقديم المستندات تنتهي غداً';
                        v_message := 'مهلة تقديم المستندات للقضية ' || r.case_number || ' تنتهي غداً.';
                    END IF;
                    PERFORM public.notify_case_coordinators(
                        r.id, 'report_deadline', v_title, v_message
                    );
                END IF;
            END IF;

            -- 6) مهلة التعقيب علي المبدئي (تذكير قبل 24 ساعة)
            IF r.initial_report_feedback_deadline_at IS NOT NULL THEN
                days_until := (r.initial_report_feedback_deadline_at::date) - CURRENT_DATE;
                IF days_until BETWEEN 0 AND 1 THEN
                    IF days_until = 0 THEN
                        v_title := 'مهلة التعقيب على المبدئي تنتهي اليوم';
                        v_message := 'مهلة التعقيب على التقرير الأولي للقضية ' || r.case_number || ' تنتهي اليوم.';
                    ELSIF days_until = 1 THEN
                        v_title := 'تذكير: مهلة التعقيب تنتهي غداً';
                        v_message := 'مهلة التعقيب على التقرير الأولي للقضية ' || r.case_number || ' تنتهي غداً.';
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
