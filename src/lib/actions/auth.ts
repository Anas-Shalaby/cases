"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  loginFormSchema,
  type LoginFormValues,
} from "@/lib/validations/case";

export async function login(values: LoginFormValues) {
  const parsed = loginFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "بيانات الدخول غير صالحة" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    if (!profile?.onboarding_completed) {
      redirect("/onboarding");
    }
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
