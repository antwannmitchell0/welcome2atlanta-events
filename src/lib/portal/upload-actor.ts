import { canUploadToEvent, type AccountStatus, type PortalActor, type PortalRole } from "./authz.ts";
import type { SqlLike } from "./event-store.ts";

export type UploadActorResult =
  | { ok: true; actor: PortalActor }
  | { ok: false; reason: "unauthenticated" | "forbidden" };

export function resolveUploadActor(input: {
  user: { id: string; email: string | null } | null;
  profile: { role: PortalRole; status: AccountStatus; display_name: string } | null;
}): UploadActorResult {
  if (!input.user) return { ok: false, reason: "unauthenticated" };
  const profile = input.profile;
  if (!profile || profile.status !== "active") return { ok: false, reason: "forbidden" };
  if (profile.role !== "owner" && profile.role !== "photographer") return { ok: false, reason: "forbidden" };
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

export function assertUploader(result: UploadActorResult): PortalActor {
  if (!result.ok) {
    throw new Error(result.reason === "unauthenticated" ? "Unauthorized" : "Forbidden");
  }
  return result.actor;
}

export async function loadAssignedEventIds(sql: SqlLike, userId: string): Promise<string[]> {
  const rows = await sql.query<{ event_id: string }>(
    `select event_id from event_assignment
     where photographer_user_id = $1 and assignment_status = 'active'`,
    [userId],
  );
  return rows.map((row) => row.event_id);
}

export function assertCanUpload(actor: PortalActor, assignedEventIds: string[], eventId: string) {
  if (!canUploadToEvent(actor, assignedEventIds, eventId)) {
    throw new Error("Forbidden");
  }
}
