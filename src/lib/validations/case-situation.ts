import { z } from "zod";

export const caseSituationSchema = z.object({
  situation: z
    .string()
    .max(2000, "الموقف طويل جداً")
    .optional()
    .or(z.literal("")),
});

export type CaseSituationValues = z.infer<typeof caseSituationSchema>;

export function emptySituation(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
