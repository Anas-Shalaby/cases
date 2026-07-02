import { z } from "zod";

import { validateCaseDates, validateScheduleDates } from "@/lib/case-date-rules";
import type { CaseMilestoneKey } from "@/lib/case-milestones";
import type { Case, CaseParty } from "@/types/database";

const optionalEmail = z
  .string()
  .email("البريد الإلكتروني غير صالح")
  .optional()
  .or(z.literal(""));

const optionalPhone = z.string().optional().or(z.literal(""));

const optionalDate = z.string().optional().or(z.literal(""));

export const partyFormSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب (حرفان على الأقل)"),
  phone: optionalPhone,
  email: optionalEmail,
  agent_name: z.string().optional().or(z.literal("")),
  agent_phone: optionalPhone,
  agent_email: optionalEmail,
});

export type PartyFormValues = z.infer<typeof partyFormSchema>;

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
  plaintiffs: z
    .array(partyFormSchema)
    .min(1, "يجب إضافة مدعي واحد على الأقل"),
  defendants: z
    .array(partyFormSchema)
    .min(1, "يجب إضافة مدعي عليه واحد على الأقل"),
  coordinator_id: z.string().uuid("يجب اختيار منسق").optional().or(z.literal("")),
  expert_id: z.string().uuid().optional().or(z.literal("")),
  assistant_id: z.string().uuid().optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  const scheduleError = validateScheduleDates({
    assignment_date: data.assignment_date,
    meeting_date: data.meeting_date,
    initial_report_date: data.initial_report_date,
    final_report_date: data.final_report_date,
  });
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

    const scheduleError = validateScheduleDates({
      assignment_date: data.assignment_date,
      meeting_date: data.meeting_date,
      initial_report_date: data.initial_report_date,
      final_report_date: data.final_report_date,
    });
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

export function partiesToFormValues(parties: CaseParty[] | undefined): {
  plaintiffs: PartyFormValues[];
  defendants: PartyFormValues[];
} {
  const sorted = [...(parties ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  const toFormParty = (party: CaseParty): PartyFormValues => ({
    name: party.name,
    phone: party.phone ?? "",
    email: party.email ?? "",
    agent_name: party.agent_name ?? "",
    agent_phone: party.agent_phone ?? "",
    agent_email: party.agent_email ?? "",
  });

  const plaintiffs = sorted
    .filter((party) => party.party_type === "plaintiff")
    .map(toFormParty);
  const defendants = sorted
    .filter((party) => party.party_type === "defendant")
    .map(toFormParty);

  return {
    plaintiffs: plaintiffs.length > 0 ? plaintiffs : [{ ...emptyPartyFormValues }],
    defendants: defendants.length > 0 ? defendants : [{ ...emptyPartyFormValues }],
  };
}

export const emptyPartyFormValues: PartyFormValues = {
  name: "",
  phone: "",
  email: "",
  agent_name: "",
  agent_phone: "",
  agent_email: "",
};
