"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, RefreshCw, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { createTeamMember } from "@/lib/actions/manage-users";
import {
  createTeamMemberSchema,
  type CreateTeamMemberValues,
} from "@/lib/validations/user";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TEAM_MEMBER_ROLE_LABELS } from "@/lib/constants";

function generatePassword(length = 12): string {
  const chars =
    "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (n) => chars[n % chars.length]).join("");
}

export function AddTeamMemberDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateTeamMemberValues>({
    resolver: zodResolver(createTeamMemberSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      role: "expert",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = form;

  const role = watch("role");

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset();
      setSuccess(false);
    }
  }

  function handleGeneratePassword() {
    setValue("password", generatePassword(), { shouldValidate: true });
  }

  function onSubmit(values: CreateTeamMemberValues) {
    setSuccess(false);
    startTransition(async () => {
      const result = await createTeamMember(values);
      if (result.error) {
        const err = result.error as Record<string, string[] | undefined>;
        if (err._form?.[0]) {
          form.setError("root", { message: err._form[0] });
        }
        if (err.full_name?.[0]) {
          form.setError("full_name", { message: err.full_name[0] });
        }
        if (err.email?.[0]) {
          form.setError("email", { message: err.email[0] });
        }
        if (err.password?.[0]) {
          form.setError("password", { message: err.password[0] });
        }
        if (err.role?.[0]) {
          form.setError("role", { message: err.role[0] });
        }
        return;
      }

      setSuccess(true);
      reset();
      router.refresh();
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 1800);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button className="w-full sm:w-auto">
            <UserPlus className="size-4" />
            إضافة عضو جديد
          </Button>
        }
      />

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة عضو جديد للفريق</DialogTitle>
          <DialogDescription>
            أنشئ حساباً لمنسق أو خبير أو مساعد خبير. سيستلم العضو بيانات
            الدخول من المنسق.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-6 text-center text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
          >
            تم إنشاء حساب العضو بنجاح!
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errors.root && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errors.root.message}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="full_name">الاسم بالكامل *</Label>
              <Input
                id="full_name"
                placeholder="مثال: أحمد محمد العتيبي"
                disabled={isPending}
                {...register("full_name")}
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني *</Label>
              <Input
                id="email"
                type="email"
                dir="ltr"
                placeholder="member@example.com"
                className="text-left"
                disabled={isPending}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور الافتراضية *</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type="text"
                  dir="ltr"
                  className="font-mono text-left"
                  disabled={isPending}
                  {...register("password")}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={isPending}
                  onClick={handleGeneratePassword}
                  title="توليد كلمة مرور قوية"
                  aria-label="توليد كلمة مرور قوية"
                >
                  <RefreshCw className="size-4" />
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">نوع الحساب / الصلاحية *</Label>
              <Select
                value={role}
                onValueChange={(value) =>
                  setValue("role", (value ?? "expert") as CreateTeamMemberValues["role"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="role" className="w-full" disabled={isPending}>
                  <SelectValue placeholder="اختر الصلاحية">
                    {TEAM_MEMBER_ROLE_LABELS[role]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coordinator">
                    {TEAM_MEMBER_ROLE_LABELS.coordinator}
                  </SelectItem>
                  <SelectItem value="expert">
                    {TEAM_MEMBER_ROLE_LABELS.expert}
                  </SelectItem>
                  <SelectItem value="assistant">
                    {TEAM_MEMBER_ROLE_LABELS.assistant}
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>

            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                onClick={() => handleOpenChange(false)}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isPending ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
