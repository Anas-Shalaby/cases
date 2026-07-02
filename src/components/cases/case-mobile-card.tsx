"use client";

import { Eye, Pencil } from "lucide-react";

import { StatusBadge } from "@/components/cases/status-badge";
import { TeamMemberCasesLink } from "@/components/cases/team-member-cases-link";
import { NavButton } from "@/components/ui/nav-button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDefendantNames, formatPlaintiffNames } from "@/lib/case-parties";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { CaseWithRelations } from "@/types/database";

interface CaseMobileCardProps {
  caseItem: CaseWithRelations;
  compact?: boolean;
  canEdit?: boolean;
}

export function CaseMobileCard({
  caseItem,
  compact = false,
  canEdit = false,
}: CaseMobileCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p
              className="font-mono text-sm font-bold text-primary"
              dir="ltr"
            >
              {caseItem.case_number}
            </p>
            <p className="line-clamp-2 font-medium leading-snug">
              {caseItem.case_name}
            </p>
            <p className="text-muted-foreground text-xs">
              {formatDate(caseItem.assignment_date)}
            </p>
          </div>
          <StatusBadge status={caseItem.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="min-w-0">
            <p className="text-muted-foreground mb-0.5 text-xs">المدعي</p>
            <p className="truncate font-medium">
              {formatPlaintiffNames(caseItem.parties)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground mb-0.5 text-xs">المدعى عليه</p>
            <p className="truncate font-medium">
              {formatDefendantNames(caseItem.parties)}
            </p>
          </div>
          {!compact && (
            <>
              <div>
                <p className="text-muted-foreground mb-0.5 text-xs">الاجتماع</p>
                <p>{formatDate(caseItem.meeting_date)}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 text-xs">
                  التقرير النهائي
                </p>
                <p>{formatDate(caseItem.final_report_date)}</p>
              </div>
            </>
          )}
        </div>

        {!compact && (
          <div className="text-muted-foreground grid grid-cols-1 gap-2 border-t pt-3 text-xs sm:grid-cols-3">
            <div className="min-w-0">
              <p className="mb-0.5">{USER_ROLE_LABELS.coordinator}</p>
              <p className="text-foreground truncate">
                {caseItem.coordinator?.full_name ?? "—"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="mb-0.5">{USER_ROLE_LABELS.expert}</p>
              <TeamMemberCasesLink
                memberId={caseItem.expert_id}
                memberName={caseItem.expert?.full_name}
                role="expert"
                className="text-foreground truncate block"
              />
            </div>
            <div className="min-w-0">
              <p className="mb-0.5">{USER_ROLE_LABELS.assistant}</p>
              <TeamMemberCasesLink
                memberId={caseItem.assistant_id}
                memberName={caseItem.assistant?.full_name}
                role="assistant"
                className="text-foreground truncate block"
              />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <NavButton
            href={`/cases/${caseItem.id}`}
            variant="outline"
            size="sm"
            className={canEdit ? "flex-1" : "w-full"}
          >
            <Eye className="size-4" />
            عرض
          </NavButton>
          {canEdit && (
            <NavButton
              href={`/cases/${caseItem.id}/edit`}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Pencil className="size-4" />
              تعديل
            </NavButton>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
