import { createAdminClient } from "@/lib/supabase/admin";
import {
  isMeetingReminderEmailConfigured,
  sendMeetingReminderEmail,
} from "@/lib/email/send-meeting-reminder-email";
import type { CaseParty } from "@/types/database";

export type MeetingReminderEmailResult = {
  sent: number;
  skipped: number;
  failed: number;
  configured: boolean;
  errors: string[];
};

function tomorrowDateString(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function getAppBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const normalized = vercelUrl.replace(/^https?:\/\//, "");
    return `https://${normalized}`;
  }

  return "http://localhost:3000";
}

type TomorrowMeetingCase = {
  id: string;
  case_number: string;
  case_name: string;
  meeting_date: string;
  coordinator_id: string;
  coordinator: { id: string; full_name: string } | null;
  parties: Pick<CaseParty, "name" | "party_type">[] | null;
};

export async function sendTomorrowMeetingReminderEmails(): Promise<MeetingReminderEmailResult> {
  const result: MeetingReminderEmailResult = {
    sent: 0,
    skipped: 0,
    failed: 0,
    configured: isMeetingReminderEmailConfigured(),
    errors: [],
  };

  if (!result.configured) {
    return result;
  }

  const admin = createAdminClient();
  const meetingDate = tomorrowDateString();

  const { data: cases, error } = await admin
    .from("cases")
    .select(
      `
      id,
      case_number,
      case_name,
      meeting_date,
      coordinator_id,
      coordinator:profiles!cases_coordinator_id_fkey(id, full_name),
      parties:case_parties(name, party_type)
    `
    )
    .eq("meeting_date", meetingDate)
    .neq("status", "closed")
    .not("coordinator_id", "is", null);

  if (error) {
    result.errors.push(error.message);
    return result;
  }

  const appBaseUrl = getAppBaseUrl();

  const rows = (cases ?? []) as unknown as TomorrowMeetingCase[];

  for (const caseItem of rows) {
    if (!caseItem.coordinator_id) {
      result.skipped++;
      continue;
    }

    const { data: existingLog } = await admin
      .from("meeting_reminder_email_log")
      .select("id")
      .eq("case_id", caseItem.id)
      .eq("meeting_date", meetingDate)
      .maybeSingle();

    if (existingLog) {
      result.skipped++;
      continue;
    }

    const { data: authUser, error: authError } =
      await admin.auth.admin.getUserById(caseItem.coordinator_id);

    const recipientEmail = authUser?.user?.email?.trim();
    if (authError || !recipientEmail) {
      result.failed++;
      result.errors.push(
        `تعذّر جلب بريد المنسق للقضية ${caseItem.case_number}`
      );
      continue;
    }

    const sendResult = await sendMeetingReminderEmail(recipientEmail, {
      coordinatorName: caseItem.coordinator?.full_name ?? "المنسق",
      caseNumber: caseItem.case_number,
      caseName: caseItem.case_name,
      meetingDate: caseItem.meeting_date,
      caseUrl: `${appBaseUrl}/cases/${caseItem.id}`,
      parties: (caseItem.parties ?? []) as Pick<
        CaseParty,
        "name" | "party_type"
      >[],
    });

    if (!sendResult.success) {
      result.failed++;
      result.errors.push(
        `فشل إرسال بريد القضية ${caseItem.case_number}: ${sendResult.error}`
      );
      continue;
    }

    const { error: logError } = await admin
      .from("meeting_reminder_email_log")
      .insert({
        case_id: caseItem.id,
        coordinator_id: caseItem.coordinator_id,
        meeting_date: meetingDate,
        recipient_email: recipientEmail,
      });

    if (logError) {
      result.failed++;
      result.errors.push(
        `تم الإرسال لكن فشل التسجيل للقضية ${caseItem.case_number}: ${logError.message}`
      );
      continue;
    }

    result.sent++;
  }

  return result;
}
