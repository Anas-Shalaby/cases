-- =============================================================================
-- Notifications & Case Documents
-- =============================================================================

CREATE TYPE notification_type AS ENUM (
    'report_deadline',
    'meeting_reminder',
    'new_document'
);

-- -----------------------------------------------------------------------------
-- Case Documents
-- -----------------------------------------------------------------------------
CREATE TABLE case_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    file_path TEXT,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_case_documents_case_id ON case_documents(case_id);
CREATE INDEX idx_case_documents_created_at ON case_documents(created_at DESC);

-- -----------------------------------------------------------------------------
-- Notifications
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_case_id ON notifications(case_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read)
    WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- -----------------------------------------------------------------------------
-- Helper: insert notification for case coordinator(s), skip duplicates today
-- -----------------------------------------------------------------------------
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
    v_coordinator_id UUID;
    v_user_id UUID;
BEGIN
    SELECT coordinator_id INTO v_coordinator_id
    FROM cases
    WHERE id = p_case_id;

    IF v_coordinator_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM notifications
            WHERE user_id = v_coordinator_id
              AND case_id = p_case_id
              AND type = p_type
              AND title = p_title
              AND created_at::date = CURRENT_DATE
        ) THEN
            INSERT INTO notifications (user_id, case_id, type, title, message)
            VALUES (v_coordinator_id, p_case_id, p_type, p_title, p_message);
        END IF;
    ELSE
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
    END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- Trigger: new document → notification
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_case_document()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_case_number TEXT;
    v_case_name TEXT;
BEGIN
    SELECT case_number, case_name
    INTO v_case_number, v_case_name
    FROM cases
    WHERE id = NEW.case_id;

    PERFORM public.notify_case_coordinators(
        NEW.case_id,
        'new_document',
        'مستند جديد مرفق',
        'تم إرفاق مستند «' || NEW.title || '» على القضية ' || v_case_number || ' — ' || v_case_name
    );

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_case_document_created
    AFTER INSERT ON case_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_case_document();

-- -----------------------------------------------------------------------------
-- Sync deadline & meeting reminders (call from app on load)
-- -----------------------------------------------------------------------------
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
        -- Meeting reminder (0–3 days ahead)
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

        -- Initial report deadline
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

        -- Final report deadline
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
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_deadline_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_case_coordinators(UUID, notification_type, TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security — case_documents
-- -----------------------------------------------------------------------------
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "case_documents_select_assigned_or_coordinator"
    ON case_documents FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM cases c
            WHERE c.id = case_documents.case_id
              AND (
                  public.get_user_role() = 'coordinator'
                  OR c.coordinator_id = auth.uid()
                  OR c.expert_id = auth.uid()
                  OR c.assistant_id = auth.uid()
              )
        )
    );

CREATE POLICY "case_documents_insert_team"
    ON case_documents FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cases c
            WHERE c.id = case_id
              AND (
                  public.get_user_role() = 'coordinator'
                  OR c.coordinator_id = auth.uid()
                  OR c.expert_id = auth.uid()
                  OR c.assistant_id = auth.uid()
              )
        )
    );

CREATE POLICY "case_documents_delete_coordinator"
    ON case_documents FOR DELETE
    TO authenticated
    USING (
        public.get_user_role() = 'coordinator'
    );

-- -----------------------------------------------------------------------------
-- Row Level Security — notifications (coordinator inbox)
-- -----------------------------------------------------------------------------
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
    ON notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
    ON notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_delete_own"
    ON notifications FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());
