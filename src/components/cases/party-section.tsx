"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  type Control,
  type FieldErrors,
  type UseFormRegister,
  useFieldArray,
} from "react-hook-form";

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
}: PartySectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName,
  });

  const sectionErrors = errors[fieldName];

  return (
    <Card>
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
          const showPartyNumber = fields.length > 1;

          return (
            <div key={field.id} className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">
                  {showPartyNumber ? `${partyLabel} ${index + 1}` : partyLabel}
                </p>
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`${fieldName}.${index}.name`}>
                    الاسم *
                  </Label>
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
                <div className="space-y-2">
                  <Label htmlFor={`${fieldName}.${index}.phone`}>
                    رقم الهاتف
                  </Label>
                  <Input
                    id={`${fieldName}.${index}.phone`}
                    dir="ltr"
                    {...register(`${fieldName}.${index}.phone`)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${fieldName}.${index}.email`}>
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id={`${fieldName}.${index}.email`}
                    type="email"
                    dir="ltr"
                    {...register(`${fieldName}.${index}.email`)}
                  />
                  {partyErrors?.email && (
                    <p className="text-sm text-destructive">
                      {partyErrors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <Separator />
              <p className="text-sm font-medium">{agentTitle}</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`${fieldName}.${index}.agent_name`}>
                    الاسم
                  </Label>
                  <Input
                    id={`${fieldName}.${index}.agent_name`}
                    {...register(`${fieldName}.${index}.agent_name`)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${fieldName}.${index}.agent_phone`}>
                    رقم الهاتف
                  </Label>
                  <Input
                    id={`${fieldName}.${index}.agent_phone`}
                    dir="ltr"
                    {...register(`${fieldName}.${index}.agent_phone`)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${fieldName}.${index}.agent_email`}>
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id={`${fieldName}.${index}.agent_email`}
                    type="email"
                    dir="ltr"
                    {...register(`${fieldName}.${index}.agent_email`)}
                  />
                  {partyErrors?.agent_email && (
                    <p className="text-sm text-destructive">
                      {partyErrors.agent_email.message}
                    </p>
                  )}
                </div>
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
