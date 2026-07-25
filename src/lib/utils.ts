import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function parseDateParts(value: string | null | undefined) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:Z|([+-])(\d{2}):?(\d{2}))?)?$/,
  );

  if (!match) return null;

  const [, year, month, day, hour = "00", minute = "00", second = "00"] = match;

  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
  };
}

function formatDateParts(parts: ReturnType<typeof parseDateParts>) {
  if (!parts) return null;

  const pad = (part: number) => String(part).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function getTimezoneOffsetString() {
  const tzOffset = -new Date().getTimezoneOffset();
  const sign = tzOffset >= 0 ? "+" : "-";
  const absOffset = Math.abs(tzOffset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${sign}${pad(Math.floor(absOffset / 60))}:${pad(absOffset % 60)}`;
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";

  const parts = parseDateParts(date);
  if (!parts) return "—";

  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(parts.year, parts.month - 1, parts.day));
}

export function formatTime(date: string | null | undefined): string | null {
  if (!date) return null;

  const parts = parseDateParts(date);
  if (!parts) return null;
  if (!date.includes("T") && date.length <= 10) return null;

  return new Intl.DateTimeFormat("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(
    new Date(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    ),
  );
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return "—";
  const time = formatTime(date);
  if (!time) return formatDate(date);
  return `${formatDate(date)} — ${time}`;
}

export function toDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  const parts = parseDateParts(value);
  if (!parts) return value.slice(0, 10);
  return formatDateParts(parts);
}

export function toDatetimeLocalValue(value: string | null | undefined): string {
  if (!value) return "";

  const parts = parseDateParts(value);
  if (!parts) return value.slice(0, 10);

  const pad = (part: number) => String(part).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function normalizeMeetingDate(
  value: string | undefined | null,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.includes("T")) {
    const parts = parseDateParts(trimmed);
    if (!parts) return null;

    const pad = (n: number) => String(n).padStart(2, "0");
    const offsetStr = getTimezoneOffsetString();
    const iso = `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}${offsetStr}`;
    return iso;
  }

  const offsetStr = getTimezoneOffsetString();
  return `${trimmed}T12:00:00${offsetStr}`;
}

export function formatRelativeTime(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffSec = Math.round((then - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });

  const absSec = Math.abs(diffSec);
  if (absSec < 60) return rtf.format(diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, "hour");
  const diffDay = Math.round(diffHour / 24);
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, "day");
  const diffMonth = Math.round(diffDay / 30);
  if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, "month");
  return rtf.format(Math.round(diffMonth / 12), "year");
}
