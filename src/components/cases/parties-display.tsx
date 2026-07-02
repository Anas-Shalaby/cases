import type { CaseParty } from "@/types/database";
import { getPartiesByType } from "@/lib/case-parties";
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
  return (
    <div className="space-y-3">
      {total > 1 && (
        <p className="text-sm font-medium">
          {partyLabel} {index + 1}
        </p>
      )}
      <InfoRow label="الاسم" value={party.name} />
      <InfoRow label="الهاتف" value={party.phone} dir="ltr" />
      <InfoRow label="البريد الإلكتروني" value={party.email} dir="ltr" />
      <Separator />
      <p className="text-sm font-medium">{agentTitle}</p>
      <InfoRow label="الاسم" value={party.agent_name} />
      <InfoRow label="الهاتف" value={party.agent_phone} dir="ltr" />
      <InfoRow label="البريد الإلكتروني" value={party.agent_email} dir="ltr" />
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