import { z } from "zod";

export const onboardingFormSchema = z.object({
  full_name: z
    .string()
    .min(2, "الاسم يجب أن يكون حرفين على الأقل")
    .max(100, "الاسم طويل جداً"),
});

export type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;

export const profileSettingsSchema = z.object({
  full_name: z
    .string()
    .min(2, "الاسم يجب أن يكون حرفين على الأقل")
    .max(100, "الاسم طويل جداً"),
});

export type ProfileSettingsValues = z.infer<typeof profileSettingsSchema>;
