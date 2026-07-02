-- =============================================================================
-- بيانات تجريبية للوحة التحكم
-- =============================================================================
-- التشغيل: Supabase → SQL Editor → الصق هذا الملف → Run
--
-- المتطلبات:
--   1. تنفيذ migrations من 001 إلى 015
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
    v_case4 UUID;
    v_case5 UUID;
    v_case6 UUID;
    v_case7 UUID;
    v_case8 UUID;
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

    v_expert := COALESCE(v_expert, v_coord);
    v_assistant := COALESCE(v_assistant, v_coord);

    INSERT INTO cases (
        case_number, case_name, status,
        assignment_date, meeting_date, initial_report_date, final_report_date,
        case_received_at, parties_invited_at,
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
        v_coord, v_expert, v_assistant
    )
    RETURNING id INTO v_case1;

    INSERT INTO case_parties (case_id, party_type, name, phone, email, sort_order) VALUES
        (v_case1, 'plaintiff', 'شركة النور للتجارة', '+966501234567', 'nour@example.com', 0),
        (v_case1, 'defendant', 'مؤسسة الأمل التجارية', '+966509876543', 'amal@example.com', 0);

    INSERT INTO cases (
        case_number, case_name, status,
        assignment_date, meeting_date, initial_report_date, final_report_date,
        case_received_at, experts_meeting_at,
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
        v_coord, v_expert, v_assistant
    )
    RETURNING id INTO v_case2;

    INSERT INTO case_parties (case_id, party_type, name, phone, sort_order) VALUES
        (v_case2, 'plaintiff', 'أحمد بن سعيد الغامدي', '+966551112233', 0),
        (v_case2, 'defendant', 'محمد بن عبدالله الحربي', '+966552223344', 0);

    INSERT INTO cases (
        case_number, case_name, status,
        assignment_date, meeting_date, initial_report_date, final_report_date,
        case_received_at, parties_invited_at, experts_meeting_at,
        initial_report_prepared_at, final_report_prepared_at, case_closed_at,
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
        v_coord, v_expert, v_assistant
    )
    RETURNING id INTO v_case3;

    INSERT INTO case_parties (case_id, party_type, name, email, sort_order) VALUES
        (v_case3, 'plaintiff', 'ورثة فهد بن راشد الدوسري', 'heirs@example.com', 0),
        (v_case3, 'defendant', 'شركة البناء الحديث', 'build@example.com', 0);

    INSERT INTO cases (
        case_number, case_name, status,
        assignment_date, meeting_date, initial_report_date, final_report_date,
        coordinator_id, expert_id, assistant_id
    ) VALUES (
        'تجريبي-004',
        'خلاف شراكة — سارة العتيبي وشركاءها',
        'open',
        CURRENT_DATE - 14,
        CURRENT_DATE,
        CURRENT_DATE + 7,
        CURRENT_DATE + 30,
        v_coord, v_expert, v_assistant
    )
    RETURNING id INTO v_case4;

    INSERT INTO case_parties (case_id, party_type, name, sort_order) VALUES
        (v_case4, 'plaintiff', 'سارة بنت خالد العتيبي', 0),
        (v_case4, 'plaintiff', 'فاطمة بنت سعد العتيبي', 1),
        (v_case4, 'defendant', 'خالد بن فهد الشمري', 0),
        (v_case4, 'defendant', 'ناصر بن علي الشمري', 1);

    INSERT INTO cases (
        case_number, case_name, status,
        assignment_date, meeting_date, initial_report_date, final_report_date,
        initial_report_prepared_at,
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
        v_coord, v_expert, v_assistant
    )
    RETURNING id INTO v_case5;

    INSERT INTO case_parties (case_id, party_type, name, phone, sort_order) VALUES
        (v_case5, 'plaintiff', 'بنك الرياض', '+966114000000', 0),
        (v_case5, 'defendant', 'عبدالرحمن بن سعد القحطاني', NULL, 0);

    INSERT INTO cases (
        case_number, case_name, status,
        assignment_date, meeting_date,
        coordinator_id, expert_id, assistant_id
    ) VALUES (
        'تجريبي-006',
        'نزاع عمالي — مصنع الخليج للبلاستيك',
        'open',
        CURRENT_DATE - 7,
        CURRENT_DATE + 5,
        v_coord, v_expert, v_assistant
    )
    RETURNING id INTO v_case6;

    INSERT INTO case_parties (case_id, party_type, name, sort_order) VALUES
        (v_case6, 'plaintiff', 'مصنع الخليج للبلاستيك', 0),
        (v_case6, 'defendant', 'عاملون سابقون (مجموعة)', 0);

    INSERT INTO cases (
        case_number, case_name, status,
        assignment_date,
        coordinator_id, expert_id, assistant_id
    ) VALUES (
        'تجريبي-007',
        'دعوى إلغاء قرار — مؤسسة التقنية المتقدمة',
        'open',
        CURRENT_DATE - 3,
        v_coord, v_expert, v_assistant
    )
    RETURNING id INTO v_case7;

    INSERT INTO case_parties (case_id, party_type, name, sort_order) VALUES
        (v_case7, 'plaintiff', 'مؤسسة التقنية المتقدمة', 0),
        (v_case7, 'defendant', 'الهيئة العامة للمنافسة', 0);

    INSERT INTO cases (
        case_number, case_name, status,
        assignment_date, final_report_date, case_closed_at,
        coordinator_id, expert_id, assistant_id
    ) VALUES (
        'تجريبي-008',
        'تسوية ودية — نورة المطيري ضد شركة النقل السريع',
        'closed',
        CURRENT_DATE - 200,
        CURRENT_DATE - 50,
        CURRENT_DATE - 45,
        v_coord, v_expert, v_assistant
    )
    RETURNING id INTO v_case8;

    INSERT INTO case_parties (case_id, party_type, name, sort_order) VALUES
        (v_case8, 'plaintiff', 'نورة بنت عبدالعزيز المطيري', 0),
        (v_case8, 'defendant', 'شركة النقل السريع', 0);

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

    IF EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'sync_deadline_notifications'
    ) THEN
        PERFORM public.sync_deadline_notifications();
    END IF;

    RAISE NOTICE 'تم إدراج 8 قضايا تجريبية + 3 مستندات. المنسق: %', v_coord;
END $$;

SELECT status, COUNT(*) AS العدد
FROM cases
WHERE case_number LIKE 'تجريبي-%'
GROUP BY status
ORDER BY status;
