import { createServerFn } from "@tanstack/react-start";
import type { AccountStatus, PortalRole } from "./authz";
import { resolvePortalMe, type PortalMe } from "./session.ts";

export type { PortalMe } from "./session.ts";
export { resolvePortalMe } from "./session.ts";

export const getPortalMe = createServerFn({ method: "GET" }).handler(async (): Promise<PortalMe> => {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const user = await getSessionUser();
  if (!user) return resolvePortalMe({ user: null, profile: null });

  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql.query<{
      role: PortalRole;
      status: AccountStatus;
      display_name: string;
    }>(`select role, status, display_name from user_profile where user_id = $1`, [user.id]);
    return resolvePortalMe({ user, profile: rows[0] ?? null });
  } catch {
    return { ok: false, reason: "forbidden" };
  }
});
