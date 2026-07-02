import { NextResponse } from "next/server";

import { sendTomorrowMeetingReminderEmails } from "@/lib/actions/meeting-reminder-emails";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const result = await sendTomorrowMeetingReminderEmails();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
