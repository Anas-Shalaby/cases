"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { updateTeamMember, type TeamMember } from "@/lib/actions/manage-users";
import {
  updateTeamMemberSchema,
  type UpdateTeamMemberValues,
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

interface EditTeamMemberDialogProps {
  member: TeamMember;
}

export function EditTeamMemberDialog({ member }: EditTeamMemberDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateTeamMemberValues>({
    resolver: zodResolver(updateTeamMemberSchema),
    defaultValues: {
      full_name: member.full_name,
      email: member.email ?? "",
      role: member.role,
      password: "",
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
    if (next) {
      reset({
        full_name: member.full_name,
        email: member.email ?? "",
        role: member.role,
        password: "",
      });
    }
  }

  function onSubmit(values: UpdateTeamMemberValues) {
    startTransition(async () => {
      const result = await updateTeamMember(member.id, values);
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

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-xs" title="تعديل">
            <Pencil className="size-3.5" />
          </Button>
        }
      />

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تعديل بيانات العضو</DialogTitle>
          <DialogDescription>
            عدّل الاسم أو البريد أو الصلاحية. اترك كلمة المرور فارغة إن لم تُرد
            تغييرها.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errors.root.message}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor={`full_name_${member.id}`}>الاسم بالكامل *</Label>
            <Input
              id={`full_name_${member.id}`}
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
            <Label htmlFor={`email_${member.id}`}>البريد الإلكتروني *</Label>
            <Input
              id={`email_${member.id}`}
              type="email"
              dir="ltr"
              className="text-left"
              disabled={isPending}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`password_${member.id}`}>
              كلمة مرور جديدة (اختياري)
            </Label>
            <Input
              id={`password_${member.id}`}
              type="password"
              dir="ltr"
              placeholder="اتركه فارغاً للإبقاء على الحالية"
              disabled={isPending}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`role_${member.id}`}>الصلاحية *</Label>
            <Select
              value={role}
              onValueChange={(value) =>
                setValue(
                  "role",
                  (value ?? "expert") as UpdateTeamMemberValues["role"],
                  { shouldValidate: true }
                )
              }
            >
              <SelectTrigger
                id={`role_${member.id}`}
                className="w-full"
                disabled={isPending}
              >
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
              onClick={() => setOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" loading={isPending}>
              {isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
