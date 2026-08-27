/** Safe in-app redirect after login. Rejects open redirects. */
export function safePortalNext(raw: unknown): string {
  if (typeof raw !== "string") return "/portal";
  const next = raw.trim();
  if (!next.startsWith("/portal")) return "/portal";
  if (next.startsWith("//") || next.includes("://") || next.includes("\\")) return "/portal";
  if (next.includes("\n") || next.includes("\r") || next.includes("@")) return "/portal";
  if (next === "/portal/login" || next.startsWith("/portal/login?")) return "/portal";
  if (next.startsWith("/portal/forgot-password") || next.startsWith("/portal/reset-password")) {
    return "/portal";
  }
  return next;
}
