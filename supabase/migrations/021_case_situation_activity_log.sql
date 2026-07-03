-- سجل نشاط تعديل موقف القضية + تقييد التعديل على المنسق فقط
ALTER TYPE log_action_type ADD VALUE IF NOT EXISTS 'update_case_situation';

CREATE OR REPLACE FUNCTION public.update_case_situation(
    p_case_id UUID,
    p_situation TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF public.get_user_role() <> 'coordinator' THEN
        RAISE EXCEPTION 'غير مصرح بتحديث موقف القضية — المنسق فقط';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM cases WHERE id = p_case_id) THEN
        RAISE EXCEPTION 'القضية غير موجودة';
    END IF;

    UPDATE cases
    SET situation = NULLIF(TRIM(p_situation), '')
    WHERE id = p_case_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_case_situation(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_case_situation(UUID, TEXT) TO authenticated;
