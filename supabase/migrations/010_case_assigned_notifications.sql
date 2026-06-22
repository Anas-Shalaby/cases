-- =============================================================================
-- إشعار إسناد قضية للخبير عند الإنشاء أو تغيير التعيين
-- =============================================================================

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'case_assigned';

-- إدراج إشعار لمستخدم واحد (بدون تكرار في نفس اليوم لنفس العنوان)
CREATE OR REPLACE FUNCTION public.notify_user(
    p_user_id UUID,
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
BEGIN
    IF p_user_id IS NULL THEN
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM notifications
        WHERE user_id = p_user_id
          AND case_id = p_case_id
          AND type = p_type
          AND title = p_title
          AND created_at::date = CURRENT_DATE
    ) THEN
        INSERT INTO notifications (user_id, case_id, type, title, message)
        VALUES (p_user_id, p_case_id, p_type, p_title, p_message);
    END IF;
END;
$$;

-- إشعار الخبير المُسند إليه القضية
CREATE OR REPLACE FUNCTION public.notify_case_expert_assignment(
    p_case_id UUID,
    p_expert_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_case_number TEXT;
    v_case_name TEXT;
    v_role user_role;
BEGIN
    IF p_expert_id IS NULL THEN
        RETURN;
    END IF;

    SELECT role INTO v_role FROM profiles WHERE id = p_expert_id;
    IF v_role IS DISTINCT FROM 'expert' THEN
        RETURN;
    END IF;

    SELECT case_number, case_name
    INTO v_case_number, v_case_name
    FROM cases
    WHERE id = p_case_id;

    PERFORM public.notify_user(
        p_expert_id,
        p_case_id,
        'case_assigned',
        'قضية جديدة مُسندة إليك',
        'تم إسناد القضية ' || v_case_number || ' — ' || v_case_name || ' إليك كخبير.'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_case_expert_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.expert_id IS NOT NULL THEN
            PERFORM public.notify_case_expert_assignment(NEW.id, NEW.expert_id);
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF NEW.expert_id IS NOT NULL
           AND NEW.expert_id IS DISTINCT FROM OLD.expert_id THEN
            PERFORM public.notify_case_expert_assignment(NEW.id, NEW.expert_id);
        END IF;
        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_case_expert_assigned ON cases;

CREATE TRIGGER on_case_expert_assigned
    AFTER INSERT OR UPDATE OF expert_id ON cases
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_case_expert_assignment();

GRANT EXECUTE ON FUNCTION public.notify_user(UUID, UUID, notification_type, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_case_expert_assignment(UUID, UUID) TO authenticated;
