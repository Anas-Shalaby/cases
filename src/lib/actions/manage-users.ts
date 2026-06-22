"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/actions/activity-logs";
import { requireCoordinator } from "@/lib/auth/require-coordinator";
import { TEAM_MEMBER_ROLE_LABELS } from "@/lib/constants";
import {
  createTeamMemberSchema,
  type CreateTeamMemberValues,
} from "@/lib/validations/user";
import type { Profile, UserRole } from "@/types/database";

export type TeamMember = Profile & {
  email: string | null;
};

async function ensureCoordinator() {
  const auth = await requireCoordinator();
  if ("error" in auth) {
    throw new Error(auth.error._form[0]);
  }
  return auth.profile;
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  await ensureCoordinator();

  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["coordinator", "expert", "assistant"])
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const { data: authData, error: authError } =
    await admin.auth.admin.listUsers({ perPage: 1000 });

  if (authError) throw new Error(authError.message);

  const emailById = new Map(
    authData.users.map((u) => [u.id, u.email ?? null])
  );

  return ((profiles ?? []) as Profile[]).map((profile) => ({
    ...profile,
    email: emailById.get(profile.id) ?? null,
  }));
}

export async function createTeamMember(values: CreateTeamMemberValues) {
  const parsed = createTeamMemberSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  let coordinator;
  try {
    coordinator = await ensureCoordinator();
  } catch (e) {
    return {
      error: {
        _form: [e instanceof Error ? e.message : "غير مصرح"],
      },
    };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return {
      error: {
        _form: [e instanceof Error ? e.message : "خطأ في إعدادات السيرفر"],
      },
    };
  }

  const { full_name, email, password, role } = parsed.data;

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name.trim(),
        role,
        onboarding_completed: true,
      },
    });

  if (createError) {
    const message =
      createError.message.includes("already been registered") ||
      createError.message.includes("already registered")
        ? "البريد الإلكتروني مسجّل مسبقاً"
        : createError.message;
    return { error: { _form: [message] } };
  }

  if (!created.user) {
    return { error: { _form: ["فشل إنشاء الحساب"] } };
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: created.user.id,
      full_name: full_name.trim(),
      role: role as UserRole,
      onboarding_completed: true,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: { _form: [profileError.message] } };
  }

  await logActivity({
    userId: coordinator.id,
    actionType: "create_user",
    description: `أضاف عضو فريق جديد: ${full_name.trim()} (${TEAM_MEMBER_ROLE_LABELS[role]}) — ${email.trim().toLowerCase()}`,
    metadata: {
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      role,
      new_user_id: created.user.id,
    },
  });

  revalidatePath("/users");
  revalidatePath("/activity-logs");
  return { success: true };
}
