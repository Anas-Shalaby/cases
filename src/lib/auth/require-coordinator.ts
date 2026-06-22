"use server";

import { getCurrentProfile } from "@/lib/actions/profile";
import type { Profile } from "@/types/database";

export async function requireCoordinator(): Promise<
  { profile: Profile } | { error: { _form: string[] } }
> {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "coordinator") {
    return { error: { _form: ["غير مصرح — هذه العملية للمنسق فقط"] } };
  }

  return { profile };
}
