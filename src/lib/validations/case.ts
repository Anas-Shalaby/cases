import { z } from "zod";

import { validateCaseDates, validateScheduleDates } from "@/lib/case-date-rules";
import type { CaseMilestoneKey } from "@/lib/case-milestones";
import type { Case } from "@/types/database";

const optionalEmail = z
  .string()
  .email("البريد الإلكتروني غير صالح")
  .optional()
  .or(z.literal(""));

const optionalPhone = z.string().optional().or(z.literal(""));

const optionalDate = z.string().optional().or(z.literal(""));

export const caseFormSchema = z.object({
  case_number: z
    .string()
    .min(1, "رقم القضية مطلوب")
    .max(50, "رقم القضية طويل جداً")
    .transform((val) => val.trim()),
  case_name: z
    .string()
    .min(2, "اسم القضية مطلوب (حرفان على الأقل)")
    .max(200, "اسم القضية طويل جداً")
    .transform((val) => val.trim()),
  status: z.enum(["open", "delayed", "closed"], {
    message: "حالة القضية مطلوبة",
  }),
  assignment_date: optionalDate,
  meeting_date: optionalDate,
  initial_report_date: optionalDate,
  final_report_date: optionalDate,
  plaintiff_name: z.string().min(2, "اسم المدعي مطلوب (حرفان على الأقل)"),
  plaintiff_phone: optionalPhone,
  plaintiff_email: optionalEmail,
  defendant_name: z.string().min(2, "اسم المدعي عليه مطلوب (حرفان على الأقل)"),
  defendant_phone: optionalPhone,
  defendant_email: optionalEmail,
  coordinator_id: z.string().uuid("يجب اختيار منسق").optional().or(z.literal("")),
  expert_id: z.string().uuid().optional().or(z.literal("")),
  assistant_id: z.string().uuid().optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  const scheduleError = validateScheduleDates(data);
  if (scheduleError) {
    ctx.addIssue({
      code: "custom",
      message: scheduleError.message,
      path: scheduleError.field ? [scheduleError.field] : ["_form"],
    });
  }
});

export type CaseFormValues = z.infer<typeof caseFormSchema>;

export type CaseFormDateContext = Pick<
  Case,
  CaseMilestoneKey | "assignment_date" | "meeting_date" | "initial_report_date" | "final_report_date"
>;

export function createCaseFormSchema(context?: CaseFormDateContext) {
  if (!context) return caseFormSchema;

  return caseFormSchema.superRefine((data, ctx) => {
    const merged: CaseFormDateContext = {
      ...context,
      assignment_date: emptyDate(data.assignment_date),
      meeting_date: emptyDate(data.meeting_date),
      initial_report_date: emptyDate(data.initial_report_date),
      final_report_date: emptyDate(data.final_report_date),
    };

    const dateError = validateCaseDates(merged);
    if (!dateError) return;

    const scheduleError = validateScheduleDates(data);
    ctx.addIssue({
      code: "custom",
      message: dateError,
      path: scheduleError?.field ? [scheduleError.field] : ["_form"],
    });
  });
}

export const loginFormSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export function emptyDate(value: string | undefined | null): string | null {
  return value && value.trim() !== "" ? value : null;
}

export function emptyUuid(value: string | undefined | null): string | null {
  return value && value.trim() !== "" ? value : null;
}
