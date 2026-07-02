"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserRound } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { completeOnboarding } from "@/lib/actions/profile";
import {
  onboardingFormSchema,
  type OnboardingFormValues,
} from "@/lib/validations/profile";
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

export function OnboardingForm() {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: { full_name: "" },
  });

  function onSubmit(values: OnboardingFormValues) {
    setFormError(null);
    startTransition(async () => {
      const result = await completeOnboarding(values);
      if (result?.error) {
        const err = result.error as Record<string, string[] | undefined>;
        if (err._form?.[0]) setFormError(err._form[0]);
        if (err.full_name?.[0]) setFormError(err.full_name[0]);
      }
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <UserRound className="size-7" />
        </div>
        <CardTitle className="text-xl">مرحباً بك!</CardTitle>
        <CardDescription>
          هذه أول مرة تسجّل دخولك. من فضلك أدخل اسمك الكامل للمتابعة.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {formError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="full_name">الاسم الكامل</Label>
            <Input
              id="full_name"
              placeholder="مثال: أحمد محمد العلي"
              autoFocus
              disabled={isPending}
              {...register("full_name")}
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">
                {errors.full_name.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" loading={isPending}>
            متابعة إلى لوحة التحكم
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
