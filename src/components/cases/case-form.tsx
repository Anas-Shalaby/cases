"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";

import { ProfileSelect } from "@/components/cases/profile-select";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CASE_STATUS_LABELS, USER_ROLE_LABELS } from "@/lib/constants";
import {
  caseFormSchema,
  type CaseFormValues,
} from "@/lib/validations/case";
import type { Case, Profile } from "@/types/database";

interface CaseFormProps {
  profiles: Pick<Profile, "id" | "full_name" | "role">[];
  initialData?: Case;
  onSubmit: (
    values: CaseFormValues
  ) => Promise<{ error?: unknown; success?: boolean; id?: string } | void>;
  submitLabel?: string;
}

const defaultValues: CaseFormValues = {
  case_number: "",
  case_name: "",
  status: "open",
  assignment_date: "",
  meeting_date: "",
  initial_report_date: "",
  final_report_date: "",
  plaintiff_name: "",
  plaintiff_phone: "",
  plaintiff_email: "",
  defendant_name: "",
  defendant_phone: "",
  defendant_email: "",
  coordinator_id: "",
  expert_id: "",
  assistant_id: "",
};

function caseToFormValues(caseData: Case): CaseFormValues {
  return {
    case_number: caseData.case_number,
    case_name: caseData.case_name,
    status: caseData.status,
    assignment_date: caseData.assignment_date ?? "",
    meeting_date: caseData.meeting_date ?? "",
    initial_report_date: caseData.initial_report_date ?? "",
    final_report_date: caseData.final_report_date ?? "",
    plaintiff_name: caseData.plaintiff_name,
    plaintiff_phone: caseData.plaintiff_phone ?? "",
    plaintiff_email: caseData.plaintiff_email ?? "",
    defendant_name: caseData.defendant_name,
    defendant_phone: caseData.defendant_phone ?? "",
    defendant_email: caseData.defendant_email ?? "",
    coordinator_id: caseData.coordinator_id ?? "",
    expert_id: caseData.expert_id ?? "",
    assistant_id: caseData.assistant_id ?? "",
  };
}

export function CaseForm({
  profiles,
  initialData,
  onSubmit,
  submitLabel = "حفظ القضية",
}: CaseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: initialData ? caseToFormValues(initialData) : defaultValues,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const status = watch("status");
  const coordinatorId = watch("coordinator_id");
  const expertId = watch("expert_id");
  const assistantId = watch("assistant_id");

  function handleFormSubmit(values: CaseFormValues) {
    setFormError(null);
    startTransition(async () => {
      const result = await onSubmit(values);

      if (result && "success" in result && result.success) {
        if ("id" in result && typeof result.id === "string") {
          router.push(`/cases/${result.id}`);
        }
        return;
      }

      if (result?.error) {
        const err = result.error as Record<string, string[] | undefined>;
        const firstError =
          err._form?.[0] ??
          err.case_number?.[0] ??
          err.case_name?.[0] ??
          err.coordinator_id?.[0] ??
          err.expert_id?.[0] ??
          err.assistant_id?.[0] ??
          Object.values(err)
            .flat()
            .find((msg): msg is string => Boolean(msg));

        if (firstError) {
          setFormError(firstError);
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {formError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {formError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>بيانات القضية</CardTitle>
          <CardDescription>رقم القضية، الاسم، والحالة والمواعيد</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="case_number">رقم القضية *</Label>
            <Input
              id="case_number"
              placeholder="مثال: 1234/2026"
              dir="ltr"
              className="font-mono font-semibold"
              {...register("case_number")}
            />
            {errors.case_number && (
              <p className="text-sm text-destructive">
                {errors.case_number.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="case_name">اسم القضية *</Label>
            <Input
              id="case_name"
              placeholder="مثال: نزاع تجاري — شركة أ vs شركة ب"
              {...register("case_name")}
            />
            {errors.case_name && (
              <p className="text-sm text-destructive">
                {errors.case_name.message}
              </p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="status">حالة القضية</Label>
            <Select
              value={status}
              onValueChange={(value) =>
                setValue("status", (value ?? "open") as CaseFormValues["status"])
              }
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="اختر الحالة">
                  {CASE_STATUS_LABELS[status]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CASE_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignment_date">تاريخ التكليف</Label>
            <Input id="assignment_date" type="date" {...register("assignment_date")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meeting_date">تاريخ الاجتماع</Label>
            <Input id="meeting_date" type="date" {...register("meeting_date")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="initial_report_date">تاريخ التقرير الأولي</Label>
            <Input
              id="initial_report_date"
              type="date"
              {...register("initial_report_date")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="final_report_date">تاريخ التقرير النهائي</Label>
            <Input
              id="final_report_date"
              type="date"
              {...register("final_report_date")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>بيانات المدعي</CardTitle>
          <CardDescription>معلومات الطرف المدعي</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="plaintiff_name">اسم المدعي *</Label>
            <Input id="plaintiff_name" {...register("plaintiff_name")} />
            {errors.plaintiff_name && (
              <p className="text-sm text-destructive">
                {errors.plaintiff_name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="plaintiff_phone">رقم الهاتف</Label>
            <Input id="plaintiff_phone" dir="ltr" {...register("plaintiff_phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plaintiff_email">البريد الإلكتروني</Label>
            <Input
              id="plaintiff_email"
              type="email"
              dir="ltr"
              {...register("plaintiff_email")}
            />
            {errors.plaintiff_email && (
              <p className="text-sm text-destructive">
                {errors.plaintiff_email.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>بيانات المدعي عليه</CardTitle>
          <CardDescription>معلومات الطرف المدعى عليه</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="defendant_name">اسم المدعي عليه *</Label>
            <Input id="defendant_name" {...register("defendant_name")} />
            {errors.defendant_name && (
              <p className="text-sm text-destructive">
                {errors.defendant_name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="defendant_phone">رقم الهاتف</Label>
            <Input id="defendant_phone" dir="ltr" {...register("defendant_phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defendant_email">البريد الإلكتروني</Label>
            <Input
              id="defendant_email"
              type="email"
              dir="ltr"
              {...register("defendant_email")}
            />
            {errors.defendant_email && (
              <p className="text-sm text-destructive">
                {errors.defendant_email.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>فريق العمل</CardTitle>
          <CardDescription>تعيين المنسق والخبير والمساعد</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>المنسق ({USER_ROLE_LABELS.coordinator})</Label>
            <ProfileSelect
              profiles={profiles}
              role="coordinator"
              value={coordinatorId ?? ""}
              onValueChange={(value) => setValue("coordinator_id", value)}
              placeholder="اختر المنسق"
              disabled={isPending}
            />
            {errors.coordinator_id && (
              <p className="text-sm text-destructive">
                {errors.coordinator_id.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>الخبير ({USER_ROLE_LABELS.expert})</Label>
            <ProfileSelect
              profiles={profiles}
              role="expert"
              value={expertId ?? ""}
              onValueChange={(value) => setValue("expert_id", value)}
              placeholder="اختر الخبير"
              disabled={isPending}
            />
            {errors.expert_id && (
              <p className="text-sm text-destructive">
                {errors.expert_id.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>المساعد ({USER_ROLE_LABELS.assistant})</Label>
            <ProfileSelect
              profiles={profiles}
              role="assistant"
              value={assistantId ?? ""}
              onValueChange={(value) => setValue("assistant_id", value)}
              placeholder="اختر المساعد"
              disabled={isPending}
            />
            {errors.assistant_id && (
              <p className="text-sm text-destructive">
                {errors.assistant_id.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-start">
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
