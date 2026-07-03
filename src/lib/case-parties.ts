import type { CaseParty, CasePartyType } from "@/types/database";
import { formatContactList, sanitizeContactList } from "@/lib/case-contacts";

export const ARABIC_ORDINALS = [
  "الأول",
  "الثاني",
  "الثالث",
  "الرابع",
  "الخامس",
  "السادس",
  "السابع",
  "الثامن",
  "التاسع",
  "العاشر",
] as const;

export function getPartyOrdinalLabel(
  index: number,
  total: number,
  baseLabel: string
): string {
  if (total <= 1) return baseLabel;
  const ordinal = ARABIC_ORDINALS[index] ?? String(index + 1);
  return `${baseLabel} ${ordinal}`;
}

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
    const searchable = [
      party.name,
      party.agent_name,
      ...sanitizeContactList(party.phones),
      ...sanitizeContactList(party.emails),
      ...sanitizeContactList(party.agent_phones),
      ...sanitizeContactList(party.agent_emails),
    ];

    return searchable.some(
      (value) => value && value.toLowerCase().includes(normalizedQuery)
    );
  });
}

export { formatContactList };
