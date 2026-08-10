import { z } from "zod";

export const expertEmailLogSchema = z.object({
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "التاريخ غير صالح"),
  log_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "الوقت غير صالح"),
  last_email_subject: z
    .string()
    .trim()
    .min(1, "يجب إدخال موضوع البريد الإلكتروني")
    .max(2000, "النص طويل جداً"),
  expert_id: z.string().uuid("يجب اختيار الخبير"),
  action_taken: z
    .string()
    .trim()
    .max(2000, "النص طويل جداً")
    .optional()
    .or(z.literal("")),
});

export type ExpertEmailLogValues = z.infer<typeof expertEmailLogSchema>;
