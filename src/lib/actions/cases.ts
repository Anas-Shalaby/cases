"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireCoordinator } from "@/lib/auth/require-coordinator";
import { logActivity } from "@/lib/actions/activity-logs";
import { CASE_MILESTONE_KEYS, type CaseMilestoneKey } from "@/lib/case-milestones";
import { collectCaseDeadlines, computeCaseStats, getCasesWithLateDeadlines, type DashboardOverview } from "@/lib/case-deadlines";
import { validateCaseDates } from "@/lib/case-date-rules";
import {
  CASE_STATUS_LABELS,
} from "@/lib/constants";
import {
  caseFormSchema,
  emptyDate,
  emptyUuid,
  type CaseFormValues,
  type PartyFormValues,
} from "@/lib/validations/case";
import type { CasePartyType, CaseWithRelations, Profile } from "@/types/database";

const CASE_SELECT = `
  *,
  parties:case_parties(*),
  coordinator:profiles!cases_coordinator_id_fkey(id, full_name),
  expert:profiles!cases_expert_id_fkey(id, full_name),
  assistant:profiles!cases_assistant_id_fkey(id, full_name)
`;

export async function getCases(): Promise<CaseWithRelations[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cases")
    .select(CASE_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((caseItem) => ({
    ...caseItem,
    parties: caseItem.parties ?? [],
  })) as CaseWithRelations[];
}

export async function getCaseById(id: string): Promise<CaseWithRelations> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cases")
    .select(CASE_SELECT)
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return {
    ...data,
    parties: data.parties ?? [],
  } as CaseWithRelations;
}

export async function getProfiles(): Promise<
  Pick<Profile, "id" | "full_name" | "role">[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .order("full_name");

  if (error) throw new Error(error.message);
  return (data ?? []) as Pick<Profile, "id" | "full_name" | "role">[];
}

export async function getCaseStats() {
  const cases = await getCases();
  return computeCaseStats(cases);
}

export async function getDashboardOverview(
  isCoordinator = false
): Promise<DashboardOverview> {
  const cases = await getCases();
  const stats = computeCaseStats(cases);

  const activeCases = cases.filter((c) => c.status !== "closed");
  const delayedCases = getCasesWithLateDeadlines(cases).slice(0, 5);

  const allDeadlines = collectCaseDeadlines(activeCases);
  const overdueDeadlines = allDeadlines
    .filter((d) => d.isLate)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 8);

  const upcomingDeadlines = allDeadlines
    .filter((d) => d.urgency === "upcoming" && d.daysUntil <= 7)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  const totalMilestones = activeCases.length * CASE_MILESTONE_KEYS.length;
  let completedMilestones = 0;

  for (const caseItem of activeCases) {
    for (const key of CASE_MILESTONE_KEYS) {
      if (caseItem[key]) completedMilestones++;
    }
  }

  const averageCompletion =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;

  let teamCount: number | undefined;
  if (isCoordinator) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .in("role", ["coordinator", "expert", "assistant"]);
    teamCount = count ?? 0;
  }

  return {
    stats,
    delayedCases,
    overdueDeadlines,
    upcomingDeadlines,
    milestoneProgress: {
      totalMilestones,
      completedMilestones,
      averageCompletion,
    },
    teamCount,
  };
}

function toCasePayload(values: CaseFormValues) {
  return {
    case_number: values.case_number.trim(),
    case_name: values.case_name.trim(),
    status: values.status,
    assignment_date: emptyDate(values.assignment_date),
    meeting_date: emptyDate(values.meeting_date),
    initial_report_date: emptyDate(values.initial_report_date),
    final_report_date: emptyDate(values.final_report_date),
    coordinator_id: emptyUuid(values.coordinator_id),
    expert_id: emptyUuid(values.expert_id),
    assistant_id: emptyUuid(values.assistant_id),
  };
}

function toPartyRows(
  caseId: string,
  partyType: CasePartyType,
  parties: PartyFormValues[]
) {
  return parties.map((party, index) => ({
    case_id: caseId,
    party_type: partyType,
    name: party.name.trim(),
    phone: party.phone || null,
    email: party.email || null,
    agent_name: party.agent_name || null,
    agent_phone: party.agent_phone || null,
    agent_email: party.agent_email || null,
    sort_order: index,
  }));
}

async function syncCaseParties(
  supabase: Awaited<ReturnType<typeof createClient>>,
  caseId: string,
  values: CaseFormValues
) {
  const { error: deleteError } = await supabase
    .from("case_parties")
    .delete()
    .eq("case_id", caseId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  const rows = [
    ...toPartyRows(caseId, "plaintiff", values.plaintiffs),
    ...toPartyRows(caseId, "defendant", values.defendants),
  ];

  const { error: insertError } = await supabase.from("case_parties").insert(rows);
  if (insertError) {
    return { error: insertError.message };
  }

  return { success: true as const };
}

export async function createCase(values: CaseFormValues) {
  const auth = await requireCoordinator();
  if ("error" in auth) return { error: auth.error };

  const parsed = caseFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const payload = toCasePayload(parsed.data);

  if (!payload.coordinator_id && user) {
    payload.coordinator_id = user.id;
  }

  const { data, error } = await supabase
    .from("cases")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: { case_number: ["رقم القضية مستخدم بالفعل"] } };
    }
    return { error: { _form: [error.message] } };
  }

  const caseId = (data as { id: string }).id;
  const partiesResult = await syncCaseParties(supabase, caseId, parsed.data);
  if ("error" in partiesResult) {
    await supabase.from("cases").delete().eq("id", caseId);
    return { error: { _form: [partiesResult.error] } };
  }

  await logActivity({
    userId: auth.profile.id,
    actionType: "create_case",
    caseId,
    description: `أنشأ قضية جديدة: ${payload.case_number} — ${payload.case_name}`,
    metadata: {
      case_number: payload.case_number,
      case_name: payload.case_name,
      status: payload.status,
    },
  });

  revalidatePath("/");
  revalidatePath("/cases");
  revalidatePath("/activity-logs");
  return { success: true, id: caseId };
}

export async function updateCase(
  id: string,
  values: CaseFormValues,
  milestones?: Record<CaseMilestoneKey, string | null>
) {
  const auth = await requireCoordinator();
  if ("error" in auth) return { error: auth.error };

  const parsed = caseFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { data: existingCase } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .single();

  const payload = toCasePayload(parsed.data);

  const milestonePayload =
    milestones !== undefined
      ? (Object.fromEntries(
          CASE_MILESTONE_KEYS.map((key) => [key, milestones[key] ?? null])
        ) as Record<CaseMilestoneKey, string | null>)
      : null;

  if (milestonePayload) {
    if (milestonePayload.case_closed_at) {
      payload.status = "closed";
    } else if (existingCase?.case_closed_at) {
      payload.status = "open";
    }
  } else if (existingCase?.case_closed_at) {
    payload.status = "closed";
  }

  const updatePayload = milestonePayload
    ? { ...payload, ...milestonePayload }
    : payload;

  if (existingCase) {
    const merged = { ...existingCase, ...updatePayload };
    const dateError = validateCaseDates(merged);
    if (dateError) {
      return { error: { _form: [dateError] } };
    }
  }

  const { error } = await supabase.from("cases").update(updatePayload).eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: { case_number: ["رقم القضية مستخدم بالفعل"] } };
    }
    return { error: { _form: [error.message] } };
  }

  const partiesResult = await syncCaseParties(supabase, id, parsed.data);
  if ("error" in partiesResult) {
    return { error: { _form: [partiesResult.error] } };
  }

  const oldStatus = existingCase?.status as string | undefined;
  const statusChanged = oldStatus && oldStatus !== payload.status;
  const description = statusChanged
    ? `عدّل القضية ${payload.case_number}: غيّر الحالة من «${CASE_STATUS_LABELS[oldStatus as keyof typeof CASE_STATUS_LABELS]}» إلى «${CASE_STATUS_LABELS[payload.status]}»`
    : `عدّل بيانات القضية ${payload.case_number} — ${payload.case_name}`;

  await logActivity({
    userId: auth.profile.id,
    actionType: "update_case",
    caseId: id,
    description,
    metadata: {
      case_number: payload.case_number,
      case_name: payload.case_name,
      ...(statusChanged
        ? { old_status: oldStatus, new_status: payload.status }
        : {}),
    },
  });

  revalidatePath("/");
  revalidatePath("/cases");
  revalidatePath(`/cases/${id}`);
  revalidatePath("/activity-logs");
  revalidatePath("/reports");
  return { success: true, id };
}

export async function deleteCase(id: string) {
  const auth = await requireCoordinator();
  if ("error" in auth) return { error: auth.error._form[0] };

  const supabase = await createClient();

  const { data: existingCase } = await supabase
    .from("cases")
    .select("case_number, case_name")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("cases").delete().eq("id", id);

  if (error) return { error: error.message };

  if (existingCase) {
    await logActivity({
      userId: auth.profile.id,
      actionType: "delete_case",
      caseId: null,
      description: `حذف القضية ${existingCase.case_number} — ${existingCase.case_name}`,
      metadata: {
        case_number: existingCase.case_number,
        case_name: existingCase.case_name,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/cases");
  revalidatePath("/activity-logs");
  redirect("/cases");
}
