import { Resend } from "resend";

import {
  buildMeetingReminderEmailHtml,
  buildMeetingReminderEmailSubject,
  type MeetingReminderEmailData,
} from "@/lib/email/meeting-reminder-template";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getFromAddress(): string | null {
  const from = process.env.EMAIL_FROM?.trim();
  return from || null;
}

export function isMeetingReminderEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && getFromAddress());
}

export async function sendMeetingReminderEmail(
  to: string,
  data: MeetingReminderEmailData
): Promise<{ success: true } | { success: false; error: string }> {
  const resend = getResendClient();
  const from = getFromAddress();

  if (!resend || !from) {
    return {
      success: false,
      error: "إعدادات البريد غير مكتملة (RESEND_API_KEY / EMAIL_FROM)",
    };
  }

  const { error } = await resend.emails.send({
    from,
    to,
    subject: buildMeetingReminderEmailSubject(data),
    html: buildMeetingReminderEmailHtml(data),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
