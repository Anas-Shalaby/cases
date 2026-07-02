import { z } from "zod";

export const createCaseTaskSchema = z.object({
  case_id: z.string().uuid("معرّف القضية غير صالح"),
  title: z
    .string()
    .trim()
    .min(3, "عنوان المهمة قصير جداً")
    .max(500, "عنوان المهمة طويل جداً"),
  description: z
    .string()
    .trim()
    .max(2000, "الوصف طويل جداً")
    .optional()
    .or(z.literal("")),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ الاستحقاق غير صالح"),
  assigned_to: z.string().uuid("يجب اختيار المكلّف بالمهمة"),
});

export type CreateCaseTaskValues = z.infer<typeof createCaseTaskSchema>;
