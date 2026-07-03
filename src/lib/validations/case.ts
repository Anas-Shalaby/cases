import { z } from "zod";

import { validateCaseDates, validateScheduleDates } from "@/lib/case-date-rules";
import { toFormContactList } from "@/lib/case-contacts";
import { normalizeMeetingDate } from "@/lib/utils";
import type { CaseMilestoneKey } from "@/lib/case-milestones";
import type { Case, CaseParty } from "@/types/database";

const optionalDate = z.string().optional().or(z.literal(""));

const optionalEmailEntry = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine(
    (value) => !value?.trim() || z.string().email().safeParse(value.trim()).success,
    { message: "البريد الإلكتروني غير صالح" }
  );

const contactListSchema = z.array(z.string());

export const partyFormSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب (حرفان على الأقل)"),
  phones: contactListSchema,
  emails: z.array(optionalEmailEntry),
  agent_name: z.string().optional().or(z.literal("")),
  agent_phones: contactListSchema,
  agent_emails: z.array(optionalEmailEntry),
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
  notes: z.string().max(5000, "الملاحظات طويلة جداً").optional().or(z.literal("")),
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
      meeting_date: normalizeMeetingDate(data.meeting_date),
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

export function emptyNotes(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function partiesToFormValues(parties: CaseParty[] | undefined): {
  plaintiffs: PartyFormValues[];
  defendants: PartyFormValues[];
} {
  const sorted = [...(parties ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  const toFormParty = (party: CaseParty): PartyFormValues => ({
    name: party.name,
    phones: toFormContactList(party.phones),
    emails: toFormContactList(party.emails),
    agent_name: party.agent_name ?? "",
    agent_phones: toFormContactList(party.agent_phones),
    agent_emails: toFormContactList(party.agent_emails),
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
  phones: [""],
  emails: [""],
  agent_name: "",
  agent_phones: [""],
  agent_emails: [""],
};
