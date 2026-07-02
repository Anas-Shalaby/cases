import type { CaseParty, CasePartyType } from "@/types/database";

export function sortParties(parties: CaseParty[]): CaseParty[] {
  return [...parties].sort((a, b) => a.sort_order - b.sort_order);
}

export function getPartiesByType(
  parties: CaseParty[] | undefined,
  partyType: CasePartyType
): CaseParty[] {
  return sortParties((parties ?? []).filter((party) => party.party_type === partyType));
}

export function formatPlaintiffNames(parties: CaseParty[] | undefined): string {
  const names = getPartiesByType(parties, "plaintiff").map((party) => party.name);
  return names.length > 0 ? names.join("، ") : "—";
}

export function formatDefendantNames(parties: CaseParty[] | undefined): string {
  const names = getPartiesByType(parties, "defendant").map((party) => party.name);
  return names.length > 0 ? names.join("، ") : "—";
}

export function formatCasePartiesSummary(parties: CaseParty[] | undefined): string {
  const plaintiffs = formatPlaintiffNames(parties);
  const defendants = formatDefendantNames(parties);
  if (plaintiffs === "—" && defendants === "—") return "—";
  return `${plaintiffs} ضد ${defendants}`;
}

export function caseMatchesPartySearch(
  parties: CaseParty[] | undefined,
  query: string
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return (parties ?? []).some((party) => {
    return (
      party.name.toLowerCase().includes(normalizedQuery) ||
      party.phone?.toLowerCase().includes(normalizedQuery) ||
      party.email?.toLowerCase().includes(normalizedQuery) ||
      party.agent_name?.toLowerCase().includes(normalizedQuery) ||
      party.agent_phone?.toLowerCase().includes(normalizedQuery) ||
      party.agent_email?.toLowerCase().includes(normalizedQuery)
    );
  });
}
