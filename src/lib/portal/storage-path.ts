import type { UploadExt } from "./files.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ORIGINAL_RE =
  /^events\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(jpg|png|webp)$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function buildOriginalPath(eventId: string, photoId: string, ext: UploadExt): string {
  if (!isUuid(eventId) || !isUuid(photoId)) throw new Error("Invalid storage path.");
  return `events/${eventId}/${photoId}.${ext}`;
}

export function buildDerivativePath(eventId: string, photoId: string, ext: UploadExt = "jpg"): string {
  if (!isUuid(eventId) || !isUuid(photoId)) throw new Error("Invalid storage path.");
  return `events/${eventId}/${photoId}.public.${ext}`;
}

export function parseOriginalPath(pathname: string): { eventId: string; photoId: string; ext: UploadExt } | null {
  const match = ORIGINAL_RE.exec(pathname);
  if (!match) return null;
  return { eventId: match[1]!, photoId: match[2]!, ext: match[3]!.toLowerCase() as UploadExt };
}

export function assertAuthorizedPath(pathname: string, eventId: string, photoId: string): void {
  const parsed = parseOriginalPath(pathname);
  if (!parsed || parsed.eventId !== eventId || parsed.photoId !== photoId) {
    throw new Error("Storage path is not authorized.");
  }
}

export function isPublicBlobUrl(url: string): boolean {
  return url.includes(".public.blob.vercel-storage.com");
}

export function isPrivateBlobUrl(url: string): boolean {
  if (url.startsWith("blob:memory:")) return true;
  return url.includes(".private.blob.vercel-storage.com");
}

export function assertPrivateBlobLocation(url: string, pathname: string): void {
  if (isPublicBlobUrl(url)) {
    throw new Error("Public Blob URLs are not allowed for originals.");
  }
  if (url.startsWith("https://") && !isPrivateBlobUrl(url)) {
    throw new Error("Blob store is not private.");
  }
  if (pathname.includes("..") || pathname.startsWith("/")) {
    throw new Error("Storage path is not authorized.");
  }
}
