import type { PortalActor } from "./authz";
import { safePortalNext } from "./redirect.ts";
import type { PortalMe } from "./session.ts";

export const PUBLIC_PORTAL_PATHS = new Set([
  "/portal/login",
  "/portal/forgot-password",
  "/portal/reset-password",
]);

export const INVALID_LOGIN_MESSAGE = "Invalid email or password.";

export type PortalGuardResult =
  | { kind: "public" }
  | { kind: "allow"; actor: PortalActor }
  | { kind: "login"; next: string };

export function portalBeforeLoad(
  pathname: string,
  search: string,
  me: PortalMe,
): PortalGuardResult {
  if (PUBLIC_PORTAL_PATHS.has(pathname)) return { kind: "public" };
  if (me.ok) return { kind: "allow", actor: me.actor };
  return { kind: "login", next: safePortalNext(`${pathname}${search}`) };
}
