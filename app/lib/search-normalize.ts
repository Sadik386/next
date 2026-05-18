export function normalizeSearchInput(input: string): string {
  if (!input) return "";
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeCodeInput(input: string): string {
  if (!input) return "";
  return input.trim().toUpperCase().replace(/[\s\-_]/g, "");
}

export function isCodeMatch(code1: string, code2: string): boolean {
  const normalized1 = normalizeCodeInput(code1);
  const normalized2 = normalizeCodeInput(code2);
  return normalized1 !== "" && normalized1 === normalized2;
}

export function buildSearchWhereClause(
  fields: string[],
  search: string
): Record<string, unknown>[] {
  const normalized = normalizeSearchInput(search);
  if (!normalized) return [];

  const orConditions: Record<string, unknown>[] = [];

  for (const field of fields) {
    orConditions.push({
      [field]: {
        contains: normalized,
        mode: "insensitive",
      },
    });
  }

  return orConditions;
}

export function buildCodeSearchWhereClause(
  fields: string[],
  code: string
): Record<string, unknown>[] {
  const normalized = normalizeCodeInput(code);
  if (!normalized) return [];

  const orConditions: Record<string, unknown>[] = [];

  for (const field of fields) {
    orConditions.push({
      [field]: {
        equals: normalized,
        mode: "insensitive",
      },
    });
  }

  return orConditions;
}