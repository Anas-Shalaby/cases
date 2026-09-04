import { NextResponse } from "next/server";
import { cleanupOldExpertEmailLogs } from "@/lib/actions/cleanup-expert-emails";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const result = await cleanupOldExpertEmailLogs();
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `تم مسح ${result.deletedCount} من السجلات القديمة.` 
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
