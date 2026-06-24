import { z } from "zod";

export const createTeamMemberSchema = z.object({
  full_name: z
    .string()
    .min(2, "الاسم يجب أن يكون حرفين على الأقل")
    .max(100, "الاسم طويل جداً"),
  email: z
    .string()
    .email("البريد الإلكتروني غير صالح")
    .max(255, "البريد الإلكتروني طويل جداً"),
  password: z
    .string()
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
    .max(72, "كلمة المرور طويلة جداً"),
  role: z.enum(["coordinator", "expert", "assistant"], {
    message: "يجب اختيار نوع الحساب",
  }),
});

export type CreateTeamMemberValues = z.infer<typeof createTeamMemberSchema>;

export const updateTeamMemberSchema = z.object({
  full_name: z
    .string()
    .min(2, "الاسم يجب أن يكون حرفين على الأقل")
    .max(100, "الاسم طويل جداً"),
  email: z
    .string()
    .email("البريد الإلكتروني غير صالح")
    .max(255, "البريد الإلكتروني طويل جداً"),
  role: z.enum(["coordinator", "expert", "assistant"], {
    message: "يجب اختيار نوع الحساب",
  }),
  password: z
    .string()
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
    .max(72, "كلمة المرور طويلة جداً")
    .optional()
    .or(z.literal("")),
});

export type UpdateTeamMemberValues = z.infer<typeof updateTeamMemberSchema>;
