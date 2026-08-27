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
import { assertAuthorizedPath, assertPrivateBlobLocation, buildOriginalPath } from "./storage-path.ts";

export type PhotoStatus = "uploading" | "processing" | "ready" | "failed";

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

export async function listEventPhotos(sql: SqlLike, eventId: string): Promise<GalleryPhotoRow[]> {
  return sql.query<GalleryPhotoRow>(
    `select * from gallery_photo where event_id = $1 order by sort_order asc, created_at asc`,
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

export async function completePhotoUpload(sql: SqlLike, input: CompleteInput): Promise<{ ok: true; status: PhotoStatus }> {
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
       set upload_status='ready', mime_type=$2, file_size=$3, checksum=$4,
           processing_error=null, updated_at=now()
       where id=$1`,
      [photo.id, detected.mime, input.bytes.byteLength, checksum],
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
