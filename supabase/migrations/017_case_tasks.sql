-- =============================================================================
-- مهام مخصصة يُسندها المنسق لأعضاء فريق القضية
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'cases'
    ) THEN
        RAISE EXCEPTION 'يجب تنفيذ migrations من 001 إلى 016 قبل تشغيل 017';
    END IF;
END $$;

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_assigned';

CREATE TYPE case_task_status AS ENUM ('pending', 'completed');

CREATE TABLE IF NOT EXISTS case_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    assigned_to UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    status case_task_status NOT NULL DEFAULT 'pending',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT case_tasks_completed_at_check CHECK (
        (status = 'completed' AND completed_at IS NOT NULL)
        OR (status = 'pending' AND completed_at IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_case_tasks_case_id ON case_tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_case_tasks_assigned_to ON case_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_case_tasks_due_date ON case_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_case_tasks_status ON case_tasks(status);

ALTER TABLE case_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "case_tasks_select_assigned_or_coordinator"
    ON case_tasks FOR SELECT
    TO authenticated
    USING (
        assigned_to = auth.uid()
        OR public.get_user_role() = 'coordinator'
    );

CREATE POLICY "case_tasks_insert_coordinator"
    ON case_tasks FOR INSERT
    TO authenticated
    WITH CHECK (public.get_user_role() = 'coordinator');

CREATE POLICY "case_tasks_update_coordinator"
    ON case_tasks FOR UPDATE
    TO authenticated
    USING (public.get_user_role() = 'coordinator')
    WITH CHECK (public.get_user_role() = 'coordinator');

CREATE POLICY "case_tasks_update_assignee_complete"
    ON case_tasks FOR UPDATE
    TO authenticated
    USING (
        assigned_to = auth.uid()
        AND status = 'pending'
    )
    WITH CHECK (
        assigned_to = auth.uid()
        AND status = 'completed'
        AND completed_at IS NOT NULL
    );

CREATE POLICY "case_tasks_delete_coordinator"
    ON case_tasks FOR DELETE
    TO authenticated
    USING (public.get_user_role() = 'coordinator');

CREATE OR REPLACE FUNCTION public.handle_case_task_assigned()
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

    PERFORM public.notify_user(
        NEW.assigned_to,
        NEW.case_id,
        'task_assigned',
        'مهمة مخصصة جديدة',
        'تم إسناد مهمة «' || NEW.title || '» على القضية '
            || COALESCE(v_case_number, '') || ' — ' || COALESCE(v_case_name, '')
            || ' مع موعد نهائي ' || TO_CHAR(NEW.due_date, 'YYYY-MM-DD')
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_case_task_assigned ON case_tasks;

CREATE TRIGGER on_case_task_assigned
    AFTER INSERT ON case_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_case_task_assigned();
