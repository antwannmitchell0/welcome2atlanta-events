import { createHash, randomUUID } from "node:crypto";
import { canUploadToEvent, publicPhotoVisible, type PortalActor } from "./authz.ts";
import { safeDisplayFilename } from "./codes.ts";
import type { SqlLike } from "./event-store.ts";
import {
  acceptDetectedImage,
  claimedUploadExt,
  detectImageSignature,
  MAX_UPLOAD_BYTES,
} from "./files.ts";
import { buildPublicDerivative } from "./image-process.ts";
import { mediaUrl } from "./media-url.ts";
import { assertAuthorizedPath, assertPrivateBlobLocation, buildDerivativePath, buildOriginalPath } from "./storage-path.ts";

export { mediaUrl };

export type PhotoStatus = "uploading" | "processing" | "ready" | "failed";
export type DerivativeSink = (pathname: string, bytes: Uint8Array, contentType: string) => Promise<unknown>;

export type GalleryPhotoRow = {
  id: string;
  event_id: string;
  storage_key: string;
  derivative_key: string | null;
  original_filename: string;
  display_filename: string;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  checksum: string;
  upload_status: PhotoStatus;
  processing_error: string | null;
  sort_order: number;
  featured: boolean;
  hidden: boolean;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
};

export type PrepareInput = {
  eventId: string;
  filename: string;
  size: number;
  declaredMime: string;
  checksum: string;
};

export type PrepareResult =
  | { ok: true; photoId: string; pathname: string }
  | { ok: false; code: "duplicate" | "rejected"; message: string };

function uniqueViolation(err: unknown): boolean {
  return Boolean(err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505");
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function isChecksum(value: string): boolean {
  return /^[a-f0-9]{64}$/.test(value);
}

export async function preparePhotoUpload(
  sql: SqlLike,
  actor: PortalActor,
  assignedEventIds: string[],
  input: PrepareInput,
): Promise<PrepareResult> {
  if (!canUploadToEvent(actor, assignedEventIds, input.eventId)) {
    return { ok: false, code: "rejected", message: "Forbidden" };
  }
  if (input.size <= 0 || input.size > MAX_UPLOAD_BYTES) {
    return { ok: false, code: "rejected", message: "File is too large." };
  }
  if (!isChecksum(input.checksum)) {
    return { ok: false, code: "rejected", message: "Checksum is invalid." };
  }
  const claimed = claimedUploadExt(input.filename, input.declaredMime);
  if (!claimed.ok) return { ok: false, code: "rejected", message: claimed.error };

  const event = await sql.query<{ id: string }>(`select id from gallery_event where id = $1`, [input.eventId]);
  if (!event[0]) return { ok: false, code: "rejected", message: "Event not found." };

  const existing = await sql.query<{ id: string; upload_status: PhotoStatus; storage_key: string }>(
    `select id, upload_status, storage_key from gallery_photo where event_id = $1 and checksum = $2`,
    [input.eventId, input.checksum],
  );
  if (existing[0] && existing[0].upload_status !== "failed") {
    return { ok: false, code: "duplicate", message: "That photo is already in this event." };
  }

  const photoId = existing[0]?.id ?? randomUUID();
  const pathname = buildOriginalPath(input.eventId, photoId, claimed.ext);
  const display = safeDisplayFilename(input.filename);
  const orderRows = await sql.query<{ max: number | string | null }>(
    `select max(sort_order) as max from gallery_photo where event_id = $1`,
    [input.eventId],
  );
  const sortOrder = Number(orderRows[0]?.max ?? 0) + 1;

  try {
    if (existing[0]) {
      await sql.query(
        `update gallery_photo
         set storage_key=$2, original_filename=$3, display_filename=$4, mime_type=$5,
             file_size=$6, upload_status='uploading', processing_error=null, updated_at=now()
         where id=$1`,
        [photoId, pathname, input.filename, display, claimed.mime, input.size],
      );
    } else {
      await sql.query(
        `insert into gallery_photo
          (id, event_id, storage_key, original_filename, display_filename, mime_type, file_size,
           checksum, upload_status, sort_order, uploaded_by)
         values ($1,$2,$3,$4,$5,$6,$7,$8,'uploading',$9,$10)`,
        [
          photoId,
          input.eventId,
          pathname,
          input.filename,
          display,
          claimed.mime,
          input.size,
          input.checksum,
          sortOrder,
          actor.userId,
        ],
      );
    }
  } catch (err) {
    if (uniqueViolation(err)) {
      return { ok: false, code: "duplicate", message: "That photo is already in this event." };
    }
    throw err;
  }

  return { ok: true, photoId, pathname };
}

export async function getPhoto(sql: SqlLike, photoId: string): Promise<GalleryPhotoRow | null> {
  const rows = await sql.query<GalleryPhotoRow>(`select * from gallery_photo where id = $1`, [photoId]);
  return rows[0] ?? null;
}

export async function getPhotoWithEvent(
  sql: SqlLike,
  photoId: string,
): Promise<{ photo: GalleryPhotoRow; eventStatus: string } | null> {
  const rows = await sql.query<GalleryPhotoRow & { event_status: string }>(
    `select p.*, e.status as event_status
     from gallery_photo p
     join gallery_event e on e.id = p.event_id
     where p.id = $1`,
    [photoId],
  );
  const row = rows[0];
  if (!row) return null;
  const { event_status, ...photo } = row;
  return { photo, eventStatus: event_status };
}

export async function listEventPhotos(sql: SqlLike, eventId: string): Promise<GalleryPhotoRow[]> {
  return sql.query<GalleryPhotoRow>(
    `select * from gallery_photo where event_id = $1 order by sort_order asc, created_at asc`,
    [eventId],
  );
}

export async function listPublicEventPhotos(sql: SqlLike, eventId: string): Promise<GalleryPhotoRow[]> {
  return sql.query<GalleryPhotoRow>(
    `select * from gallery_photo
     where event_id = $1 and upload_status = 'ready' and hidden = false
     order by sort_order asc, created_at asc`,
    [eventId],
  );
}

export async function recordUploadFailure(
  sql: SqlLike,
  input: { eventId?: string; userId: string; filename: string; message: string },
) {
  await sql.query(
    `insert into upload_failure (id, event_id, user_id, filename, message) values ($1,$2,$3,$4,$5)`,
    [randomUUID(), input.eventId ?? null, input.userId, input.filename, input.message],
  );
}

export async function failPhoto(sql: SqlLike, photoId: string, message: string) {
  await sql.query(
    `update gallery_photo
     set upload_status='failed', processing_error=$2, updated_at=now()
     where id=$1`,
    [photoId, message],
  );
}

export type CompleteInput = {
  photoId: string;
  pathname: string;
  url: string;
  bytes: Uint8Array;
};

export async function completePhotoUpload(
  sql: SqlLike,
  input: CompleteInput,
  sink?: DerivativeSink,
): Promise<{ ok: true; status: PhotoStatus }> {
  const photo = await getPhoto(sql, input.photoId);
  if (!photo) throw new Error("Photo not found.");
  if (photo.upload_status === "ready") return { ok: true, status: "ready" };

  try {
    assertAuthorizedPath(input.pathname, photo.event_id, photo.id);
    if (input.pathname !== photo.storage_key) throw new Error("Storage path is not authorized.");
    assertPrivateBlobLocation(input.url, input.pathname);
    if (input.bytes.byteLength > MAX_UPLOAD_BYTES) throw new Error("File is too large.");
    const detected = acceptDetectedImage(detectImageSignature(input.bytes));
    if (!detected.ok) throw new Error(detected.error);
    const checksum = sha256Hex(input.bytes);
    if (photo.checksum && photo.checksum !== checksum) throw new Error("File checksum does not match.");

    await sql.query(
      `update gallery_photo
       set upload_status='processing', mime_type=$2, file_size=$3, checksum=$4,
           processing_error=null, updated_at=now()
       where id=$1`,
      [photo.id, detected.mime, input.bytes.byteLength, checksum],
    );

    const derivative = buildPublicDerivative(input.bytes);
    const ext = derivative.mime === "image/png" ? "png" : derivative.mime === "image/webp" ? "webp" : "jpg";
    const derivativeKey = buildDerivativePath(photo.event_id, photo.id, ext);
    if (sink) await sink(derivativeKey, derivative.bytes, derivative.mime);

    await sql.query(
      `update gallery_photo
       set upload_status='ready', mime_type=$2, file_size=$3, checksum=$4,
           width=$5, height=$6, derivative_key=$7, processing_error=null, updated_at=now()
       where id=$1`,
      [
        photo.id,
        detected.mime,
        input.bytes.byteLength,
        checksum,
        derivative.width,
        derivative.height,
        derivativeKey,
      ],
    );
    return { ok: true, status: "ready" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    await failPhoto(sql, photo.id, message);
    throw err;
  }
}

export function publicMediaAllowed(eventStatus: string, photo: Pick<GalleryPhotoRow, "upload_status" | "hidden">) {
  return publicPhotoVisible({
    eventStatus,
    uploadStatus: photo.upload_status,
    hidden: photo.hidden,
  });
}

export async function setPhotoCover(sql: SqlLike, eventId: string, photoId: string) {
  const photo = await getPhoto(sql, photoId);
  if (!photo || photo.event_id !== eventId) throw new Error("Photo not found.");
  if (photo.upload_status !== "ready" || photo.hidden) throw new Error("Cover photo must be a visible ready image.");
  await sql.query(`update gallery_event set cover_photo_id=$2, updated_at=now() where id=$1`, [eventId, photoId]);
  return { ok: true as const };
}

export async function setPhotoFlags(
  sql: SqlLike,
  photoId: string,
  flags: { featured?: boolean; hidden?: boolean },
) {
  const photo = await getPhoto(sql, photoId);
  if (!photo) throw new Error("Photo not found.");
  const featured = flags.featured ?? photo.featured;
  const hidden = flags.hidden ?? photo.hidden;
  await sql.query(
    `update gallery_photo set featured=$2, hidden=$3, updated_at=now() where id=$1`,
    [photoId, featured, hidden],
  );
  if (hidden) {
    await sql.query(
      `update gallery_event set cover_photo_id=null, updated_at=now()
       where id=$1 and cover_photo_id=$2`,
      [photo.event_id, photoId],
    );
  }
  return { ok: true as const, featured, hidden };
}

export async function reorderEventPhotos(sql: SqlLike, eventId: string, photoIds: string[]) {
  const existing = await listEventPhotos(sql, eventId);
  const allowed = new Set(existing.map((row) => row.id));
  if (photoIds.length !== existing.length || photoIds.some((id) => !allowed.has(id))) {
    throw new Error("Photo order is invalid.");
  }
  for (let i = 0; i < photoIds.length; i += 1) {
    await sql.query(`update gallery_photo set sort_order=$2, updated_at=now() where id=$1`, [photoIds[i], i + 1]);
  }
  return { ok: true as const };
}

export async function deleteEventPhoto(
  sql: SqlLike,
  eventId: string,
  photoId: string,
  removeBlob?: (pathname: string) => Promise<void>,
) {
  const photo = await getPhoto(sql, photoId);
  if (!photo || photo.event_id !== eventId) throw new Error("Photo not found.");
  await sql.query(
    `update gallery_event set cover_photo_id=null, updated_at=now() where id=$1 and cover_photo_id=$2`,
    [eventId, photoId],
  );
  await sql.query(`delete from gallery_photo where id=$1`, [photoId]);
  if (removeBlob) {
    try {
      await removeBlob(photo.storage_key);
    } catch {
      /* original may already be gone */
    }
    if (photo.derivative_key) {
      try {
        await removeBlob(photo.derivative_key);
      } catch {
        /* derivative may already be gone */
      }
    }
  }
  return { ok: true as const };
}
