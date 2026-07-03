export function sanitizeContactList(
  values: Array<string | undefined> | undefined
): string[] {
  if (!values) return [];
  return values.map((value) => (value ?? "").trim()).filter(Boolean);
}

export function toFormContactList(
  values: string[] | null | undefined
): string[] {
  const items = sanitizeContactList(values ?? undefined);
  return items.length > 0 ? items : [""];
}

export function formatContactList(
  values: string[] | null | undefined
): string | null {
  const items = sanitizeContactList(values ?? undefined);
  return items.length > 0 ? items.join(" • ") : null;
}
