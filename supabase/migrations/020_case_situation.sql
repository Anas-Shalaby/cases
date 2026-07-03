-- Free-text case situation (موقف القضية) — editable by coordinators only
ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS situation TEXT;

CREATE OR REPLACE FUNCTION public.update_case_situation(
    p_case_id UUID,
    p_situation TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_expert_id UUID;
BEGIN
    v_role := public.get_user_role();

    SELECT expert_id INTO v_expert_id
    FROM cases
    WHERE id = p_case_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'القضية غير موجودة';
    END IF;

    IF v_role = 'coordinator' THEN
        NULL;
    ELSIF v_role = 'expert' AND v_expert_id = auth.uid() THEN
        NULL;
    ELSE
        RAISE EXCEPTION 'غير مصرح بتحديث موقف هذه القضية';
    END IF;

    UPDATE cases
    SET situation = NULLIF(TRIM(p_situation), '')
    WHERE id = p_case_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_case_situation(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_case_situation(UUID, TEXT) TO authenticated;
