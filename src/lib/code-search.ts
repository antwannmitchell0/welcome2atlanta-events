export type CodeSearch = { code?: string };

export function parseCodeSearch(search: Record<string, unknown>): CodeSearch {
  const raw = search.code;
  if (typeof raw !== "string" || !raw.trim()) return {};
  return { code: raw.trim() };
}

export function codeFromSearchString(search: string): string | undefined {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const code = params.get("code");
  return code?.trim() ? code.trim() : undefined;
}
