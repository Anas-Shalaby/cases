"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { USER_ROLE_LABELS } from "@/lib/constants";
import type { CaseWithRelations } from "@/types/database";

export interface CaseTeamMember {
  id: string;
  full_name: string;
  roleLabel: string;
}

export function getCaseTeamMembers(
  caseData: CaseWithRelations | null | undefined
): CaseTeamMember[] {
  if (!caseData) return [];

  const members: CaseTeamMember[] = [];

  if (caseData.coordinator_id && caseData.coordinator) {
    members.push({
      id: caseData.coordinator_id,
      full_name: caseData.coordinator.full_name,
      roleLabel: USER_ROLE_LABELS.coordinator,
    });
  }

  if (caseData.expert_id && caseData.expert) {
    members.push({
      id: caseData.expert_id,
      full_name: caseData.expert.full_name,
      roleLabel: USER_ROLE_LABELS.expert,
    });
  }

  if (caseData.assistant_id && caseData.assistant) {
    members.push({
      id: caseData.assistant_id,
      full_name: caseData.assistant.full_name,
      roleLabel: USER_ROLE_LABELS.assistant,
    });
  }

  return members;
}

interface CaseTeamMemberSelectProps {
  caseData: CaseWithRelations | null | undefined;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
}

export function CaseTeamMemberSelect({
  caseData,
  value,
  onValueChange,
  disabled,
  id,
}: CaseTeamMemberSelectProps) {
  const members = getCaseTeamMembers(caseData);
  const selected = members.find((member) => member.id === value);

  return (
    <Select
      value={value || ""}
      onValueChange={(next) => onValueChange(next ?? "")}
      disabled={disabled || members.length === 0}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="اختر المكلّف بالمهمة">
          {selected ? `${selected.full_name} (${selected.roleLabel})` : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {members.map((member) => (
          <SelectItem key={member.id} value={member.id}>
            {member.full_name} — {member.roleLabel}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
