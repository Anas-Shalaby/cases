"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type ComponentProps, type MouseEvent } from "react";

import { Button, type buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

type NavButtonProps = Omit<ComponentProps<typeof Button>, "render" | "loading" | "onClick"> &
  VariantProps<typeof buttonVariants> & {
    href: string;
    onNavigate?: () => void;
  };

export function NavButton({
  href,
  children,
  onNavigate,
  ...buttonProps
}: NavButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented) return;

    event.preventDefault();
    onNavigate?.();
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <Button
      {...buttonProps}
      loading={isPending}
      render={<Link href={href} onClick={handleClick} />}
    >
      {children}
    </Button>
  );
}

type NavLinkProps = ComponentProps<typeof Link> & {
  active?: boolean;
};

export function NavLink({
  href,
  children,
  className,
  onClick,
  active = false,
  ...props
}: NavLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;

    event.preventDefault();
    startTransition(() => {
      router.push(typeof href === "string" ? href : href.pathname ?? "/");
    });
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-busy={isPending}
      className={cn(
        className,
        isPending && "pointer-events-none opacity-70"
      )}
      {...props}
    >
      {isPending ? (
        <span className="inline-flex items-center gap-2">
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {children}
        </span>
      ) : (
        children
      )}
    </Link>
  );
}
