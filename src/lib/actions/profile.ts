"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  onboardingFormSchema,
  profileSettingsSchema,
  type OnboardingFormValues,
  type ProfileSettingsValues,
} from "@/lib/validations/profile";
import type { Profile } from "@/types/database";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data as Profile | null;
}

export async function completeOnboarding(values: OnboardingFormValues) {
  const parsed = onboardingFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: { _form: ["يجب تسجيل الدخول أولاً"] } };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name.trim(),
      onboarding_completed: true,
    })
    .eq("id", user.id);

  if (error) return { error: { _form: [error.message] } };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function updateProfileSettings(values: ProfileSettingsValues) {
  const parsed = profileSettingsSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: { _form: ["يجب تسجيل الدخول أولاً"] } };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name.trim() })
    .eq("id", user.id);

  if (error) return { error: { _form: [error.message] } };

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  return { success: true };
}
