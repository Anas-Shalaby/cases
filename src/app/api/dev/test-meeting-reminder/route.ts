import { NextResponse } from "next/server";

import { sendTomorrowMeetingReminderEmails } from "@/lib/actions/meeting-reminder-emails";
import { createAdminClient } from "@/lib/supabase/admin";

const TEST_CASE_NUMBER = "تجريبي-بريد-غدا";

function tomorrowDateString(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "غير متاح في الإنتاج" }, { status: 404 });
  }

  const admin = createAdminClient();
  const meetingDate = tomorrowDateString();

  let coordinator: { id: string; full_name: string } | null = null;

  const { data: coordRow, error: coordError } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("role", "coordinator")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (coordError) {
    return NextResponse.json(
      {
        error: coordError.message,
        hint: "تأكد أن SUPABASE_SERVICE_ROLE_KEY يخص نفس مشروع NEXT_PUBLIC_SUPABASE_URL",
      },
      { status: 500 }
    );
  }

  coordinator = coordRow;

  if (!coordinator) {
    const { data: anyProfile, error: anyError } = await admin
      .from("profiles")
      .select("id, full_name")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (anyError) {
      return NextResponse.json({ error: anyError.message }, { status: 500 });
    }

    coordinator = anyProfile;
  }

  if (!coordinator) {
    return NextResponse.json(
      { error: "لا يوجد منسق في النظام. سجّل دخولك وأكمل إعداد الحساب أولاً." },
      { status: 400 }
    );
  }

  const { data: existingCase } = await admin
    .from("cases")
    .select("id")
    .eq("case_number", TEST_CASE_NUMBER)
    .maybeSingle();

  let caseId = existingCase?.id;

  if (caseId) {
    const { error: updateError } = await admin
      .from("cases")
      .update({
        meeting_date: meetingDate,
        status: "open",
        coordinator_id: coordinator.id,
      })
      .eq("id", caseId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  } else {
    const { data: newCase, error: insertError } = await admin
      .from("cases")
      .insert({
        case_number: TEST_CASE_NUMBER,
        case_name: "اختبار بريد تذكير الاجتماع — غداً",
        status: "open",
        assignment_date: new Date().toISOString().slice(0, 10),
        meeting_date: meetingDate,
        coordinator_id: coordinator.id,
        expert_id: coordinator.id,
        assistant_id: coordinator.id,
      })
      .select("id")
      .single();

    if (insertError || !newCase) {
      return NextResponse.json(
        { error: insertError?.message ?? "فشل إنشاء القضية" },
        { status: 500 }
      );
    }

    caseId = newCase.id;

    await admin.from("case_parties").insert([
      {
        case_id: caseId,
        party_type: "plaintiff",
        name: "شركة الاختبار للتجارة",
        phone: "+966501111111",
        email: "plaintiff@test.com",
        sort_order: 0,
      },
      {
        case_id: caseId,
        party_type: "defendant",
        name: "مؤسسة التجربة",
        phone: "+966502222222",
        email: "defendant@test.com",
        sort_order: 0,
      },
    ]);
  }

  await admin
    .from("meeting_reminder_email_log")
    .delete()
    .eq("case_id", caseId)
    .eq("meeting_date", meetingDate);

  const emailResult = await sendTomorrowMeetingReminderEmails();

  return NextResponse.json({
    testCase: {
      id: caseId,
      case_number: TEST_CASE_NUMBER,
      meeting_date: meetingDate,
      coordinator: coordinator.full_name,
    },
    emailResult,
  });
}
