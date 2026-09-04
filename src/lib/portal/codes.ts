const CODE_PATTERN = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
const GUEST_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const RESERVED_DEMO_CODES = [
  "ATL-404",
  "ATL-BELT",
  "ATL-O4W",
  "ATL-INVEST",
  "ATL-WTAE",
] as const;

export function normalizeEventCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidEventCode(raw: string): boolean {
  const code = normalizeEventCode(raw);
  return code.length >= 4 && code.length <= 24 && CODE_PATTERN.test(code);
}

export function isGuestEventCode(raw: string): boolean {
  const code = normalizeEventCode(raw);
  const match = /^ATL-([A-Z0-9]{4,6})$/.exec(code);
  return Boolean(match);
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

/** ATL-XXXX to ATL-XXXXXX. Collision checks happen at mint time. */
export function generateGuestCode(length: 4 | 5 | 6 = 4, random: () => number = Math.random): string {
  const size = Math.min(6, Math.max(4, length));
  let suffix = "";
  for (let i = 0; i < size; i += 1) {
    suffix += GUEST_ALPHABET[Math.floor(random() * GUEST_ALPHABET.length)]!;
  }
  return `ATL-${suffix}`;
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
