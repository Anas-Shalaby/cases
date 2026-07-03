import type { CaseParty } from "@/types/database";
import { formatContactList } from "@/lib/case-contacts";
import { getPartiesByType, getPartyOrdinalLabel } from "@/lib/case-parties";
import { Separator } from "@/components/ui/separator";

function InfoRow({
  label,
  value,
  dir,
}: {
  label: string;
  value: string | null;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-start sm:justify-between">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span
        className="break-all font-medium sm:max-w-[65%] sm:text-left"
        dir={dir}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

function PartyBlock({
  party,
  index,
  total,
  partyLabel,
  agentTitle,
}: {
  party: CaseParty;
  index: number;
  total: number;
  partyLabel: string;
  agentTitle: string;
}) {
  const partyTitle = getPartyOrdinalLabel(index, total, partyLabel);
  const agentSectionTitle = getPartyOrdinalLabel(index, total, agentTitle);

  return (
    <div className="space-y-3">
      {total > 1 && <p className="text-sm font-medium">{partyTitle}</p>}
      <InfoRow label="الاسم" value={party.name} />
      <InfoRow
        label="أرقام الهاتف"
        value={formatContactList(party.phones)}
        dir="ltr"
      />
      <InfoRow
        label="البريد الإلكتروني"
        value={formatContactList(party.emails)}
        dir="ltr"
      />
      <Separator />
      <p className="text-sm font-medium">{agentSectionTitle}</p>
      <InfoRow label="الاسم" value={party.agent_name} />
      <InfoRow
        label="أرقام الهاتف"
        value={formatContactList(party.agent_phones)}
        dir="ltr"
      />
      <InfoRow
        label="البريد الإلكتروني"
        value={formatContactList(party.agent_emails)}
        dir="ltr"
      />
    </div>
  );
}

export function PartiesCard({
  parties,
  title,
  partyType,
  partyLabel,
  agentTitle,
}: {
  parties: CaseParty[] | undefined;
  title: string;
  partyType: "plaintiff" | "defendant";
  partyLabel: string;
  agentTitle: string;
}) {
  const items = getPartiesByType(parties, partyType);

  return (
    <div className="space-y-4">
      {items.map((party, index) => (
        <div key={party.id}>
          {index > 0 && <Separator className="mb-4" />}
          <PartyBlock
            party={party}
            index={index}
            total={items.length}
            partyLabel={partyLabel}
            agentTitle={agentTitle}
          />
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-muted-foreground text-sm">لا توجد بيانات</p>
      )}
    </div>
  );
}
