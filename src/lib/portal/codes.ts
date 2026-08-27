const CODE_PATTERN = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;

export function normalizeEventCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidEventCode(raw: string): boolean {
  const code = normalizeEventCode(raw);
  return code.length >= 4 && code.length <= 24 && CODE_PATTERN.test(code);
}

export function generateEventCode(name: string): string {
  const stem =
    name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 10) || "EVT";
  const suffix = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(2, 6);
  return `ATL-${stem}-${suffix}`.replace(/-+/g, "-").slice(0, 24);
}

export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "event";
}

export function safeDisplayFilename(original: string): string {
  const base = original.split(/[/\\]/).pop() ?? "photo";
  return base.replace(/[^\w.-]+/g, "_").slice(0, 120) || "photo";
}
