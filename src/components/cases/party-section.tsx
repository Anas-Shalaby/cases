"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  type Control,
  type FieldErrors,
  type UseFormRegister,
  useFieldArray,
} from "react-hook-form";

import { ContactListField } from "@/components/cases/contact-list-field";
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
import { Separator } from "@/components/ui/separator";
import { getPartyOrdinalLabel } from "@/lib/case-parties";
import { cn } from "@/lib/utils";
import {
  emptyPartyFormValues,
  type CaseFormValues,
} from "@/lib/validations/case";

interface PartySectionProps {
  title: string;
  description: string;
  partyLabel: string;
  agentTitle: string;
  fieldName: "plaintiffs" | "defendants";
  control: Control<CaseFormValues>;
  register: UseFormRegister<CaseFormValues>;
  errors: FieldErrors<CaseFormValues>;
  disabled?: boolean;
  colorVariant?: "blue" | "amber";
}

export function PartySection({
  title,
  description,
  partyLabel,
  agentTitle,
  fieldName,
  control,
  register,
  errors,
  disabled = false,
  colorVariant,
}: PartySectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName,
  });

  const sectionErrors = errors[fieldName];

  const getPartyColor = (type: "plaintiffs" | "defendants", index: number) => {
    if (type === "plaintiffs") {
      const colors = [
        "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20",
        "border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-900/20",
        "border-violet-200 bg-violet-50/50 dark:border-violet-800 dark:bg-violet-900/20",
        "border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-900/20",
        "border-fuchsia-200 bg-fuchsia-50/50 dark:border-fuchsia-800 dark:bg-fuchsia-900/20",
      ];
      return colors[index % colors.length];
    } else {
      const colors = [
        "border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-900/20",
        "border-rose-200 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-900/20",
        "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/20",
        "border-pink-200 bg-pink-50/50 dark:border-pink-800 dark:bg-pink-900/20",
        "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/20",
      ];
      return colors[index % colors.length];
    }
  };

  return (
    <Card className={cn(
      colorVariant === "blue" && "border-blue-200 bg-blue-50/30 dark:border-blue-900 dark:bg-blue-950/20",
      colorVariant === "amber" && "border-amber-200 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-950/20",
    )}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => append({ ...emptyPartyFormValues })}
        >
          <Plus className="size-4" />
          إضافة
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {fields.map((field, index) => {
          const partyErrors = sectionErrors?.[index];
          const partyTitle = getPartyOrdinalLabel(
            index,
            fields.length,
            partyLabel
          );
          const agentSectionTitle = getPartyOrdinalLabel(
            index,
            fields.length,
            agentTitle
          );

          return (
            <div
              key={field.id}
              className={cn(
                "space-y-4 rounded-lg border p-4",
                getPartyColor(fieldName, index)
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{partyTitle}</p>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" />
                    حذف
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`${fieldName}.${index}.name`}>الاسم *</Label>
                  <Input
                    id={`${fieldName}.${index}.name`}
                    {...register(`${fieldName}.${index}.name`)}
                  />
                  {partyErrors?.name && (
                    <p className="text-sm text-destructive">
                      {partyErrors.name.message}
                    </p>
                  )}
                </div>

                <ContactListField
                  control={control}
                  register={register}
                  name={`${fieldName}.${index}.phones`}
                  label="أرقام الهاتف"
                  inputType="tel"
                  disabled={disabled}
                />

                <ContactListField
                  control={control}
                  register={register}
                  name={`${fieldName}.${index}.emails`}
                  label="البريد الإلكتروني"
                  inputType="email"
                  disabled={disabled}
                />
                {partyErrors?.emails && (
                  <p className="text-sm text-destructive">
                    {typeof partyErrors.emails.message === "string"
                      ? partyErrors.emails.message
                      : "تحقق من عناوين البريد الإلكتروني"}
                  </p>
                )}
              </div>

              <Separator />
              <p className="text-sm font-semibold">{agentSectionTitle}</p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`${fieldName}.${index}.agent_name`}>
                    الاسم
                  </Label>
                  <Input
                    id={`${fieldName}.${index}.agent_name`}
                    {...register(`${fieldName}.${index}.agent_name`)}
                  />
                </div>

                <ContactListField
                  control={control}
                  register={register}
                  name={`${fieldName}.${index}.agent_phones`}
                  label="أرقام هاتف الوكيل"
                  inputType="tel"
                  disabled={disabled}
                />

                <ContactListField
                  control={control}
                  register={register}
                  name={`${fieldName}.${index}.agent_emails`}
                  label="بريد الوكيل الإلكتروني"
                  inputType="email"
                  disabled={disabled}
                />
                {partyErrors?.agent_emails && (
                  <p className="text-sm text-destructive">
                    {typeof partyErrors.agent_emails.message === "string"
                      ? partyErrors.agent_emails.message
                      : "تحقق من عناوين بريد الوكيل"}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {typeof sectionErrors?.message === "string" && (
          <p className="text-sm text-destructive">{sectionErrors.message}</p>
        )}
      </CardContent>
    </Card>
  );
}
