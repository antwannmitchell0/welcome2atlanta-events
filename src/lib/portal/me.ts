import { createServerFn } from "@tanstack/react-start";
import type { PortalActor } from "./authz";

export type PortalMe =
  | { ok: true; actor: PortalActor }
  | { ok: false; reason: "unauthenticated" | "forbidden" };

export const getPortalMe = createServerFn({ method: "GET" }).handler(async (): Promise<PortalMe> => {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql.query<{
      role: PortalActor["role"];
      status: PortalActor["status"];
      display_name: string;
    }>(`select role, status, display_name from user_profile where user_id = $1`, [user.id]);
    const profile = rows[0];
    if (!profile || profile.status !== "active" || profile.role !== "owner") {
      return { ok: false, reason: "forbidden" };
    }
    return {
      ok: true,
      actor: {
        userId: user.id,
        email: user.email,
        role: profile.role,
        status: profile.status,
        displayName: profile.display_name,
      },
    };
  } catch {
    return { ok: false, reason: "forbidden" };
  }
});
