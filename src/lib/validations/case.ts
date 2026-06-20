import { z } from "zod";

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
});

export type CaseFormValues = z.infer<typeof caseFormSchema>;

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
