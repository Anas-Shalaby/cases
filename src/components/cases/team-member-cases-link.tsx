import Link from "next/link";

import { cn } from "@/lib/utils";

interface TeamMemberCasesLinkProps {
  memberId: string | null | undefined;
  memberName: string | null | undefined;
  role: "expert" | "assistant";
  className?: string;
  muted?: boolean;
}

export function TeamMemberCasesLink({
  memberId,
  memberName,
  role,
  className,
  muted,
}: TeamMemberCasesLinkProps) {
  const display = memberName?.trim();

  if (!memberId || !display) {
    return <span className={cn(muted && "text-muted-foreground", className)}>—</span>;
  }

  const param = role === "expert" ? "expert" : "assistant";

  return (
    <Link
      href={`/cases?${param}=${memberId}`}
      className={cn(
        "font-medium hover:text-primary hover:underline",
        muted && "text-muted-foreground hover:text-primary",
        className
      )}
      title={`عرض قضايا ${display}`}
    >
      {display}
    </Link>
  );
}
