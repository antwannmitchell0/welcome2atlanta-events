import type { AccountStatus, PortalActor, PortalRole } from "./authz";

export type PortalMe =
  | { ok: true; actor: PortalActor }
  | { ok: false; reason: "unauthenticated" | "forbidden" };

export function resolvePortalMe(input: {
  user: { id: string; email: string | null } | null;
  profile: { role: PortalRole; status: AccountStatus; display_name: string } | null;
}): PortalMe {
  if (!input.user) return { ok: false, reason: "unauthenticated" };
  const profile = input.profile;
  if (!profile || profile.status !== "active" || profile.role !== "owner") {
    return { ok: false, reason: "forbidden" };
  }
  return {
    ok: true,
    actor: {
      userId: input.user.id,
      email: input.user.email,
      role: profile.role,
      status: profile.status,
      displayName: profile.display_name,
    },
  };
}
