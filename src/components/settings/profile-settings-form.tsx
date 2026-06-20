"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { updateProfileSettings } from "@/lib/actions/profile";
import {
  profileSettingsSchema,
  type ProfileSettingsValues,
} from "@/lib/validations/profile";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/types/database";

interface ProfileSettingsFormProps {
  profile: Profile;
}

export function ProfileSettingsForm({ profile }: ProfileSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileSettingsValues>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: { full_name: profile.full_name },
  });

  function onSubmit(values: ProfileSettingsValues) {
    setFormError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateProfileSettings(values);
      if (result?.error) {
        const err = result.error as Record<string, string[] | undefined>;
        if (err._form?.[0]) setFormError(err._form[0]);
        if (err.full_name?.[0]) setFormError(err.full_name[0]);
      } else if (result?.success) {
        setSuccess(true);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>الملف الشخصي</CardTitle>
        <CardDescription>تحديث بيانات حسابك</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
          {formError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {formError}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 className="size-4 shrink-0" />
              تم حفظ التغييرات بنجاح
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="full_name">الاسم الكامل</Label>
            <Input id="full_name" {...register("full_name")} />
            {errors.full_name && (
              <p className="text-sm text-destructive">
                {errors.full_name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>الدور</Label>
            <Input
              value={USER_ROLE_LABELS[profile.role]}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              يتم تعيين الدور من قبل مدير النظام
            </p>
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            حفظ التغييرات
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
