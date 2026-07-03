"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  type Control,
  type FieldPath,
  type UseFormRegister,
  useFieldArray,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CaseFormValues } from "@/lib/validations/case";

interface ContactListFieldProps {
  control: Control<CaseFormValues>;
  register: UseFormRegister<CaseFormValues>;
  name: FieldPath<CaseFormValues>;
  label: string;
  inputType?: "text" | "email" | "tel";
  disabled?: boolean;
}

export function ContactListField({
  control,
  register,
  name,
  label,
  inputType = "text",
  disabled = false,
}: ContactListFieldProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: name as never,
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => append("" as never)}
        >
          <Plus className="size-4" />
          إضافة
        </Button>
      </div>

      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <Input
              type={inputType}
              dir="ltr"
              disabled={disabled}
              placeholder={index === 0 ? undefined : `إضافي ${index + 1}`}
              {...register(`${name}.${index}` as FieldPath<CaseFormValues>)}
            />
            {fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled}
                onClick={() => remove(index)}
                aria-label="حذف"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
