"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TEAM_MEMBER_ROLE_LABELS } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import type { TeamMember } from "@/lib/actions/manage-users";
import type { UserRole } from "@/types/database";
import { DeleteTeamMemberButton } from "@/components/users/delete-team-member-button";
import { EditTeamMemberDialog } from "@/components/users/edit-team-member-dialog";

type RoleFilter = "all" | "coordinator" | "expert" | "assistant";

interface TeamUsersListProps {
  members: TeamMember[];
}

const roleBadgeClass: Record<"coordinator" | "expert" | "assistant", string> = {
  coordinator:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  expert: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  assistant:
    "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
};

export function TeamUsersList({ members }: TeamUsersListProps) {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const filtered = useMemo(() => {
    if (roleFilter === "all") return members;
    return members.filter((m) => m.role === roleFilter);
  }, [members, roleFilter]);

  const counts = useMemo(
    () => ({
      all: members.length,
      coordinator: members.filter((m) => m.role === "coordinator").length,
      expert: members.filter((m) => m.role === "expert").length,
      assistant: members.filter((m) => m.role === "assistant").length,
    }),
    [members]
  );

  if (members.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted">
            <Users className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">لا يوجد أعضاء في الفريق بعد</h3>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            أضف منسقين وخبراء ومساعدي خبراء لإدارة القضايا
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          إجمالي الأعضاء:{" "}
          <span className="text-foreground font-semibold">{members.length}</span>
        </p>
        <Select
          value={roleFilter}
          onValueChange={(v) => setRoleFilter((v ?? "all") as RoleFilter)}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="تصفية حسب الصلاحية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل ({counts.all})</SelectItem>
            <SelectItem value="coordinator">
              {TEAM_MEMBER_ROLE_LABELS.coordinator} ({counts.coordinator})
            </SelectItem>
            <SelectItem value="expert">
              {TEAM_MEMBER_ROLE_LABELS.expert} ({counts.expert})
            </SelectItem>
            <SelectItem value="assistant">
              {TEAM_MEMBER_ROLE_LABELS.assistant} ({counts.assistant})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* جدول — شاشات كبيرة */}
      <Card className="hidden overflow-hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>الاسم بالكامل</TableHead>
              <TableHead>البريد الإلكتروني</TableHead>
              <TableHead>الصلاحية</TableHead>
              <TableHead>تاريخ الانضمام</TableHead>
              <TableHead className="w-24">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-10 text-center"
                >
                  لا توجد نتائج لهذا التصفية
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((member) => (
                <MemberRow key={member.id} member={member} />
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* بطاقات — موبايل */}
      <div className="space-y-3 lg:hidden">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-10 text-center text-sm">
              لا توجد نتائج لهذا التصفية
            </CardContent>
          </Card>
        ) : (
          filtered.map((member) => (
            <Card key={member.id}>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{member.full_name}</p>
                  <RoleBadge role={member.role} />
                </div>
                <p className="text-muted-foreground text-sm" dir="ltr">
                  {member.email ?? "—"}
                </p>
                <p className="text-muted-foreground text-xs">
                  انضم {formatDate(member.created_at)}
                </p>
                <div className="flex items-center gap-1 border-t pt-3">
                  <EditTeamMemberDialog member={member} />
                  <DeleteTeamMemberButton
                    userId={member.id}
                    userName={member.full_name}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function MemberRow({ member }: { member: TeamMember }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{member.full_name}</TableCell>
      <TableCell dir="ltr" className="text-muted-foreground">
        {member.email ?? "—"}
      </TableCell>
      <TableCell>
        <RoleBadge role={member.role} />
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatDate(member.created_at)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-0.5">
          <EditTeamMemberDialog member={member} />
          <DeleteTeamMemberButton
            userId={member.id}
            userName={member.full_name}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  if (role !== "coordinator" && role !== "expert" && role !== "assistant") {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className={cn("border-transparent", roleBadgeClass[role])}
    >
      {TEAM_MEMBER_ROLE_LABELS[role]}
    </Badge>
  );
}
