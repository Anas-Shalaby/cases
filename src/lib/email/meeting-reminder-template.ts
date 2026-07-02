import {
  formatDefendantNames,
  formatPlaintiffNames,
} from "@/lib/case-parties";
import type { CaseParty } from "@/types/database";

export type MeetingReminderEmailData = {
  coordinatorName: string;
  caseNumber: string;
  caseName: string;
  meetingDate: string;
  caseUrl: string;
  parties?: Pick<CaseParty, "name" | "party_type">[];
};

function formatMeetingDateLong(date: string): string {
  return new Intl.DateTimeFormat("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function formatPartiesSummary(
  parties: Pick<CaseParty, "name" | "party_type">[] | undefined
): string {
  if (!parties?.length) return "—";
  const asParties = parties as CaseParty[];
  return `${formatPlaintiffNames(asParties)} ضد ${formatDefendantNames(asParties)}`;
}

export function buildMeetingReminderEmailSubject(data: MeetingReminderEmailData): string {
  return `📅 تذكير لطيف: اجتماع غداً — القضية ${data.caseNumber}`;
}

export function buildMeetingReminderEmailHtml(
  data: MeetingReminderEmailData
): string {
  const partiesSummary = formatPartiesSummary(data.parties);

  const meetingLabel = formatMeetingDateLong(data.meetingDate);
  const greetingName = data.coordinatorName.trim() || "منسقنا الكريم";

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>تذكير اجتماع القضية</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#eef2f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,0.10);">
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f 0%,#2e5077 55%,#0f766e 100%);padding:32px 28px;text-align:center;">
              <div style="font-size:42px;line-height:1;margin-bottom:12px;">📅</div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.5;">
                تذكير لطيف باجتماع غداً
              </h1>
              <p style="margin:12px 0 0;color:rgba(255,255,255,0.88);font-size:14px;line-height:1.7;">
                نتمنى لك يوماً منظماً ومثمراً
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 28px 8px;">
              <p style="margin:0 0 16px;color:#334155;font-size:16px;line-height:1.9;">
                مرحباً <strong style="color:#1e3a5f;">${escapeHtml(greetingName)}</strong>،
              </p>
              <p style="margin:0;color:#475569;font-size:15px;line-height:1.9;">
                نود تذكيرك بلطف أن لديك <strong>اجتماعاً مرتبطاً بإحدى القضايا غداً</strong>.
                نأمل أن يساعدك هذا التنبيه على الاستعداد مسبقاً بكل يسر وسهولة.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 28px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 8px;color:#64748b;font-size:12px;font-weight:700;letter-spacing:0.4px;">
                      تفاصيل القضية
                    </p>
                    <p style="margin:0 0 6px;color:#0f172a;font-size:18px;font-weight:700;line-height:1.6;">
                      ${escapeHtml(data.caseName)}
                    </p>
                    <p style="margin:0 0 14px;color:#1e3a5f;font-size:14px;font-weight:600;direction:ltr;text-align:right;">
                      ${escapeHtml(data.caseNumber)}
                    </p>
                    <p style="margin:0;color:#475569;font-size:14px;line-height:1.8;">
                      <strong>الأطراف:</strong> ${escapeHtml(partiesSummary)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#ecfdf5 0%,#f0f9ff 100%);border:1px solid #99f6e4;border-radius:16px;">
                <tr>
                  <td style="padding:20px;text-align:center;">
                    <p style="margin:0 0 6px;color:#0f766e;font-size:13px;font-weight:700;">
                      موعد الاجتماع
                    </p>
                    <p style="margin:0;color:#134e4a;font-size:20px;font-weight:700;line-height:1.6;">
                      غداً
                    </p>
                    <p style="margin:8px 0 0;color:#115e59;font-size:15px;line-height:1.7;">
                      ${escapeHtml(meetingLabel)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 28px;text-align:center;">
              <a href="${escapeHtml(data.caseUrl)}"
                 style="display:inline-block;background:#1e3a5f;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:12px;box-shadow:0 8px 20px rgba(30,58,95,0.22);">
                عرض تفاصيل القضية
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 28px;">
              <p style="margin:0;color:#64748b;font-size:13px;line-height:1.8;text-align:center;">
                مع أطيب التحيات،<br />
                <strong style="color:#334155;">فريق نظام إدارة القضايا</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#f8fafc;padding:18px 28px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.7;text-align:center;">
                هذا البريد أُرسل تلقائياً قبل موعد الاجتماع بيوم واحد لتسهيل متابعتك للقضايا.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
