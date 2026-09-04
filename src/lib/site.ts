/** Public site origin and social slots. Handles stay in this file. */
export const SITE_ORIGIN = "https://www.welcome2atlantaevents.com";

export const socialLinks = [
  { id: "instagram", label: "Instagram", href: "#" },
  { id: "tiktok", label: "TikTok", href: "#" },
  { id: "x", label: "X", href: "#" },
] as const;

export function photosPathForCode(code: string): string {
  return `/photos?code=${encodeURIComponent(code.trim().toUpperCase())}`;
}

export function photosUrlForCode(code: string): string {
  return `${SITE_ORIGIN}${photosPathForCode(code)}`;
}

export function printPathForCode(code: string): string {
  return `/print/code/${encodeURIComponent(code.trim().toUpperCase())}`;
}

export function neighborhoodCaption(neighborhood: string, code?: string): string {
  const place = neighborhood.trim() || "Atlanta";
  const url = code ? photosUrlForCode(code) : SITE_ORIGIN;
  return `Caught in ${place}. This is The A. Now find yourself in it.\n\n${url}`;
}
