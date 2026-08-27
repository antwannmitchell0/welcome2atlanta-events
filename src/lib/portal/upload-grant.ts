import type { HandleUploadBody } from "@vercel/blob/client";
import { canUploadToEvent, type PortalActor } from "./authz.ts";
import {
  ALLOWED_UPLOAD_CONTENT_TYPES,
  BLOB_ACCESS,
  blobTokenPresent,
  HANDLE_UPLOAD_URL,
  requireBlobToken,
  tokenValidUntil,
} from "./blob-config.ts";
import { MAX_UPLOAD_BYTES } from "./files.ts";
import { completePhotoUpload, getPhoto, type PrepareInput, preparePhotoUpload } from "./photo-store.ts";
import type { SqlLike } from "./event-store.ts";
import { assertAuthorizedPath } from "./storage-path.ts";
import { assertCanUpload } from "./upload-actor.ts";

export type TokenConstraints = {
  allowedContentTypes: string[];
  maximumSizeInBytes: number;
  validUntil: number;
  addRandomSuffix: false;
  allowOverwrite: false;
  tokenPayload: string;
};

export function buildUploadTokenOptions(input: {
  photoId: string;
  eventId: string;
  userId: string;
  storageKey: string;
  now?: number;
}): TokenConstraints {
  return {
    allowedContentTypes: ALLOWED_UPLOAD_CONTENT_TYPES,
    maximumSizeInBytes: MAX_UPLOAD_BYTES,
    validUntil: tokenValidUntil(input.now),
    addRandomSuffix: false,
    allowOverwrite: false,
    tokenPayload: JSON.stringify({
      photoId: input.photoId,
      eventId: input.eventId,
      userId: input.userId,
      storageKey: input.storageKey,
    }),
  };
}

export async function createUploadGrant(
  sql: SqlLike,
  actor: PortalActor,
  assignedEventIds: string[],
  input: PrepareInput,
) {
  if (!blobTokenPresent()) {
    return { ok: false as const, code: "rejected" as const, message: "Private object storage is not configured." };
  }
  if (!canUploadToEvent(actor, assignedEventIds, input.eventId)) {
    return { ok: false as const, code: "rejected" as const, message: "Forbidden" };
  }
  const prepared = await preparePhotoUpload(sql, actor, assignedEventIds, input);
  if (!prepared.ok) return prepared;
  return {
    ok: true as const,
    photoId: prepared.photoId,
    pathname: prepared.pathname,
    handleUploadUrl: HANDLE_UPLOAD_URL,
    access: BLOB_ACCESS,
  };
}

export async function authorizeClientPath(
  sql: SqlLike,
  actor: PortalActor,
  assignedEventIds: string[],
  pathname: string,
  clientPayload: string | null,
) {
  let photoId = "";
  if (clientPayload) {
    try {
      const parsed = JSON.parse(clientPayload) as { photoId?: unknown };
      if (typeof parsed.photoId === "string") photoId = parsed.photoId;
    } catch {
      throw new Error("Upload grant is invalid.");
    }
  }
  if (!photoId) throw new Error("Upload grant is invalid.");
  const photo = await getPhoto(sql, photoId);
  if (!photo) throw new Error("Forbidden");
  assertCanUpload(actor, assignedEventIds, photo.event_id);
  assertAuthorizedPath(pathname, photo.event_id, photo.id);
  if (pathname !== photo.storage_key) throw new Error("Storage path is not authorized.");
  if (photo.upload_status === "ready") throw new Error("That photo is already uploaded.");
  return buildUploadTokenOptions({
    photoId: photo.id,
    eventId: photo.event_id,
    userId: actor.userId,
    storageKey: photo.storage_key,
  });
}

export function parseTokenPayload(raw: string | null | undefined): { photoId: string; storageKey: string } {
  if (!raw) throw new Error("Upload grant is invalid.");
  const parsed = JSON.parse(raw) as { photoId?: unknown; storageKey?: unknown };
  if (typeof parsed.photoId !== "string" || typeof parsed.storageKey !== "string") {
    throw new Error("Upload grant is invalid.");
  }
  return { photoId: parsed.photoId, storageKey: parsed.storageKey };
}

export async function finishConfirmedUpload(
  sql: SqlLike,
  input: { pathname: string; url: string; tokenPayload?: string | null; bytes: Uint8Array },
) {
  const payload = parseTokenPayload(input.tokenPayload);
  if (input.pathname !== payload.storageKey) throw new Error("Storage path is not authorized.");
  return completePhotoUpload(sql, {
    photoId: payload.photoId,
    pathname: input.pathname,
    url: input.url,
    bytes: input.bytes,
  });
}

export function isHandleUploadBody(body: unknown): body is HandleUploadBody {
  if (!body || typeof body !== "object") return false;
  const type = (body as { type?: unknown }).type;
  return type === "blob.generate-client-token" || type === "blob.upload-completed";
}

export { requireBlobToken, HANDLE_UPLOAD_URL, BLOB_ACCESS };
