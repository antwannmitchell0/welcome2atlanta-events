import { publicPhotoVisible, type PortalActor } from "./authz.ts";
import type { GalleryPhotoRow } from "./photo-store.ts";

export type MediaAccess =
  | { ok: true; mode: "public" | "owner" }
  | { ok: false; status: 401 | 403 | 404 };

export function resolveMediaAccess(input: {
  photo: GalleryPhotoRow | null;
  eventStatus: string | null;
  actor: PortalActor | null;
}): MediaAccess {
  if (!input.photo || !input.eventStatus) return { ok: false, status: 404 };
  if (
    publicPhotoVisible({
      eventStatus: input.eventStatus,
      uploadStatus: input.photo.upload_status,
      hidden: input.photo.hidden,
    })
  ) {
    return { ok: true, mode: "public" };
  }
  if (!input.actor) return { ok: false, status: 404 };
  if (input.actor.status !== "active") return { ok: false, status: 403 };
  if (input.actor.role === "owner") return { ok: true, mode: "owner" };
  return { ok: false, status: 403 };
}

export function mediaPathForAccess(photo: GalleryPhotoRow, mode: "public" | "owner"): string | null {
  if (mode === "public") return photo.derivative_key;
  return photo.storage_key || photo.derivative_key;
}
