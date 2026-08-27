import { Buffer } from "node:buffer";
import type { AccountStatus, PortalRole } from "./authz.ts";
import { readPrivateBlob } from "./blob-io.ts";
import { mediaPathForAccess, resolveMediaAccess } from "./media-access.ts";
import { getPhotoWithEvent } from "./photo-store.ts";
import { resolvePortalMe } from "./session.ts";

const CACHE_PUBLIC = "public, max-age=3600, stale-while-revalidate=86400";
const CACHE_PRIVATE = "private, no-store";

async function currentActor() {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const user = await getSessionUser();
  if (!user) return null;
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql.query<{
      role: PortalRole;
      status: AccountStatus;
      display_name: string;
    }>(`select role, status, display_name from user_profile where user_id = $1`, [user.id]);
    const me = resolvePortalMe({ user, profile: rows[0] ?? null });
    return me.ok ? me.actor : null;
  } catch {
    return null;
  }
}

function empty(status: number) {
  return new Response(null, {
    status,
    headers: {
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}

function contentTypeForPath(pathname: string): string {
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export async function handleMediaGet(photoId: string): Promise<Response> {
  if (!photoId) return empty(404);
  const actor = await currentActor();
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const row = await getPhotoWithEvent(sql, photoId);
    const access = resolveMediaAccess({
      photo: row?.photo ?? null,
      eventStatus: row?.eventStatus ?? null,
      actor,
    });
    if (!access.ok) return empty(access.status);
    const photo = row!.photo;
    const pathname = mediaPathForAccess(photo, access.mode);
    if (!pathname) return empty(404);
    const bytes = await readPrivateBlob(pathname);
    if (!bytes) return empty(404);
    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": contentTypeForPath(pathname),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": access.mode === "public" ? CACHE_PUBLIC : CACHE_PRIVATE,
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch {
    return empty(404);
  }
}
