import type { CaseWithRelations, UserRole } from "@/types/database";

export function canViewCaseSituations(role: UserRole): boolean {
  return role === "coordinator" || role === "expert";
}

export function canEditCaseSituation(role: UserRole): boolean {
  return role === "coordinator";
}

export function filterCasesForSituationPanel(
  cases: CaseWithRelations[],
  role: UserRole,
  userId: string
): CaseWithRelations[] {
  const activeCases = cases.filter((caseItem) => caseItem.status !== "closed");

  if (role === "coordinator") return activeCases;
  if (role === "expert") {
    return activeCases.filter((caseItem) => caseItem.expert_id === userId);
  }

  return [];
}
