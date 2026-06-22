"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Profile, UserRole } from "@/types/database";

interface ProfileSelectProps {
  profiles: Pick<Profile, "id" | "full_name" | "role">[];
  role: UserRole;
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  id?: string;
}

export function ProfileSelect({
  profiles,
  role,
  value,
  onValueChange,
  placeholder,
  disabled,
  id,
}: ProfileSelectProps) {
  const options = profiles.filter((p) => p.role === role);
  const selected = options.find((p) => p.id === value);

  return (
    <Select
      value={value || ""}
      onValueChange={(next) => onValueChange(next ?? "")}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder}>
          {selected?.full_name ?? null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((profile) => (
          <SelectItem key={profile.id} value={profile.id}>
            {profile.full_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
