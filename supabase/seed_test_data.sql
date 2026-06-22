-- =============================================================================
-- بيانات تجريبية للوحة التحكم
-- =============================================================================
-- التشغيل: Supabase → SQL Editor → الصق هذا الملف → Run
--
-- المتطلبات:
--   1. تنفيذ migrations من 001 إلى 008
--   2. تسجيل حساب واحد على الأقل (منسق) وإكمال onboarding
--
-- يحذف البيانات التجريبية السابقة (case_number يبدأ بـ «تجريبي-») ثم يعيد إدراجها.
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'notifications'
    ) THEN
        DELETE FROM notifications
        WHERE case_id IN (SELECT id FROM cases WHERE case_number LIKE 'تجريبي-%');
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'case_documents'
    ) THEN
        DELETE FROM case_documents
        WHERE case_id IN (SELECT id FROM cases WHERE case_number LIKE 'تجريبي-%');
    END IF;
END $$;

DELETE FROM cases WHERE case_number LIKE 'تجريبي-%';

DO $$
DECLARE
    v_coord UUID;
    v_expert UUID;
    v_assistant UUID;
    v_case1 UUID;
    v_case2 UUID;
    v_case3 UUID;
BEGIN
    SELECT id INTO v_coord
    FROM profiles
    WHERE role = 'coordinator'
    ORDER BY created_at
    LIMIT 1;

    IF v_coord IS NULL THEN
        RAISE EXCEPTION 'لا يوجد منسق في النظام. سجّل دخولك أولاً وأكمل إعداد الحساب.';
    END IF;

    SELECT id INTO v_expert
    FROM profiles
    WHERE role = 'expert'
    ORDER BY created_at
    LIMIT 1;

    SELECT id INTO v_assistant
    FROM profiles
    WHERE role = 'assistant'
    ORDER BY created_at
    LIMIT 1;

    -- إن لم يوجد خبير/مساعد، استخدم المنسق (للعرض فقط)
    v_expert := COALESCE(v_expert, v_coord);
    v_assistant := COALESCE(v_assistant, v_coord);

    -- ── قضية 1: مفتوحة — اجتماع غداً (تنبيه meeting_reminder) ──
    INSERT INTO cases (
        case_number, case_name, status,
        assignment_date, meeting_date, initial_report_date, final_report_date,
        case_received_at, parties_invited_at,
        plaintiff_name, plaintiff_phone, plaintiff_email,
        defendant_name, defendant_phone, defendant_email,
        coordinator_id, expert_id, assistant_id
    ) VALUES (
        'تجريبي-001',
        'نزاع تجاري — شركة النور ضد مؤسسة الأمل',
        'open',
        CURRENT_DATE - 30,
        CURRENT_DATE + 1,
        CURRENT_DATE + 14,
        CURRENT_DATE + 45,
        CURRENT_DATE - 28,
        CURRENT_DATE - 20,
        'شركة النور للتجارة',
        '+966501234567',
        'nour@example.com',
        'مؤسسة الأمل التجارية',
        '+966509876543',
        'amal@example.com',
        v_coord, v_expert, v_assistant
    )
    RETURNING id INTO v_case1;

    -- ── قضية 2: متأخرة — تقرير أولي متأخر ──
    INSERT INTO cases (
        case_number, case_name, status,
        assignment_date, meeting_date, initial_report_date, final_report_date,
        case_received_at, experts_meeting_at,
        plaintiff_name, plaintiff_phone,
        defendant_name, defendant_phone,
        coordinator_id, expert_id, assistant_id
    ) VALUES (
        'تجريبي-002',
        'دعوى تعويض — أحمد السعيد ضد محمد الحربي',
        'delayed',
        CURRENT_DATE - 60,
        CURRENT_DATE - 15,
        CURRENT_DATE - 1,
        CURRENT_DATE + 20,
        CURRENT_DATE - 58,
        CURRENT_DATE - 40,
        'أحمد بن سعيد الغامدي',
        '+966551112233',
        'محمد بن عبدالله الحربي',
        '+966552223344',
        v_coord, v_expert, v_assistant
    )
    RETURNING id INTO v_case2;

    -- ── قضية 3: مغلقة ──
    INSERT INTO cases (
        case_number, case_name, status,
        assignment_date, meeting_date, initial_report_date, final_report_date,
        case_received_at, parties_invited_at, experts_meeting_at,
        initial_report_prepared_at, final_report_prepared_at, case_closed_at,
        plaintiff_name, plaintiff_email,
        defendant_name, defendant_email,
        coordinator_id, expert_id, assistant_id
    ) VALUES (
        'تجريبي-003',
        'نزاع عقاري — ورثة فهد الدوسري',
        'closed',
        CURRENT_DATE - 120,
        CURRENT_DATE - 90,
        CURRENT_DATE - 75,
        CURRENT_DATE - 30,
        CURRENT_DATE - 118,
        CURRENT_DATE - 110,
        CURRENT_DATE - 95,
        CURRENT_DATE - 70,
        CURRENT_DATE - 35,
        CURRENT_DATE - 10,
        'ورثة فهد بن راشد الدوسري',
        'heirs@example.com',
        'شركة البناء الحديث',
        'build@example.com',
        v_coord, v_expert, v_assistant
    )
    RETURNING id INTO v_case3;

    -- ── قضية 4: مفتوحة — اجتماع اليوم ──
    INSERT INTO cases (
        case_number, case_name, status,
        assignment_date, meeting_date, initial_report_date, final_report_date,
        plaintiff_name, defendant_name,
        coordinator_id, expert_id, assistant_id
    ) VALUES (
        'تجريبي-004',
        'خلاف شراكة — سارة العتيبي وشركاءها',
        'open',
        CURRENT_DATE - 14,
        CURRENT_DATE,
        CURRENT_DATE + 7,
        CURRENT_DATE + 30,
        'سارة بنت خالد العتيبي',
        'خالد بن فهد الشمري وشركاؤه',
        v_coord, v_expert, v_assistant
    );

    -- ── قضية 5: متأخرة — تقرير نهائي قريب ──
    INSERT INTO cases (
        case_number, case_name, status,
        assignment_date, meeting_date, initial_report_date, final_report_date,
        initial_report_prepared_at,
        plaintiff_name, plaintiff_phone,
        defendant_name,
        coordinator_id, expert_id, assistant_id
    ) VALUES (
        'تجريبي-005',
        'مطالبة مالية — بنك الرياض ضد عبدالرحمن القحطاني',
        'delayed',
        CURRENT_DATE - 45,
        CURRENT_DATE - 30,
        CURRENT_DATE - 20,
        CURRENT_DATE + 2,
        CURRENT_DATE - 18,
        'بنك الرياض',
        '+966114000000',
        'عبدالرحمن بن سعد القحطاني',
        v_coord, v_expert, v_assistant
    );

    -- ── قضية 6: مفتوحة ──
    INSERT INTO cases (
        case_number, case_name, status,
        assignment_date, meeting_date,
        plaintiff_name, defendant_name,
        coordinator_id, expert_id, assistant_id
    ) VALUES (
        'تجريبي-006',
        'نزاع عمالي — مصنع الخليج للبلاستيك',
        'open',
        CURRENT_DATE - 7,
        CURRENT_DATE + 5,
        'مصنع الخليج للبلاستيك',
        'عاملون سابقون (مجموعة)',
        v_coord, v_expert, v_assistant
    );

    -- ── قضية 7: مفتوحة ──
    INSERT INTO cases (
        case_number, case_name, status,
        assignment_date,
        plaintiff_name, defendant_name,
        coordinator_id, expert_id, assistant_id
    ) VALUES (
        'تجريبي-007',
        'دعوى إلغاء قرار — مؤسسة التقنية المتقدمة',
        'open',
        CURRENT_DATE - 3,
        'مؤسسة التقنية المتقدمة',
        'الهيئة العامة للمنافسة',
        v_coord, v_expert, v_assistant
    );

    -- ── قضية 8: مغلقة ──
    INSERT INTO cases (
        case_number, case_name, status,
        assignment_date, final_report_date, case_closed_at,
        plaintiff_name, defendant_name,
        coordinator_id, expert_id, assistant_id
    ) VALUES (
        'تجريبي-008',
        'تسوية ودية — نورة المطيري ضد شركة النقل السريع',
        'closed',
        CURRENT_DATE - 200,
        CURRENT_DATE - 50,
        CURRENT_DATE - 45,
        'نورة بنت عبدالعزيز المطيري',
        'شركة النقل السريع',
        v_coord, v_expert, v_assistant
    );

    -- ── مستندات تجريبية (تُنشئ تنبيهات new_document للمنسق) ──
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'case_documents'
    ) THEN
        INSERT INTO case_documents (case_id, title, uploaded_by)
        VALUES
            (v_case1, 'مذكرة الدفاع الأولية', v_coord),
            (v_case1, 'عقد الشراكة الأصلي', v_coord),
            (v_case2, 'محضر جلسة التحقيق', v_expert);
    END IF;

    -- ── مزامنة تنبيهات المواعيد (اجتماعات + تقارير) ──
    IF EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'sync_deadline_notifications'
    ) THEN
        PERFORM public.sync_deadline_notifications();
    END IF;

    RAISE NOTICE 'تم إدراج 8 قضايا تجريبية + 3 مستندات. المنسق: %', v_coord;
END $$;

-- تحقق سريع
SELECT status, COUNT(*) AS العدد
FROM cases
WHERE case_number LIKE 'تجريبي-%'
GROUP BY status
ORDER BY status;
