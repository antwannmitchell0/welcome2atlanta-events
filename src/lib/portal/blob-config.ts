import { MAX_UPLOAD_BYTES, UPLOAD_MIME } from "./files.ts";

export const BLOB_TOKEN_ENV = "BLOB_READ_WRITE_TOKEN";
export const BLOB_ACCESS = "private" as const;
export const UPLOAD_TOKEN_TTL_MS = 15 * 60 * 1000;
export const HANDLE_UPLOAD_URL = "/api/portal/upload";
export const ALLOWED_UPLOAD_CONTENT_TYPES = [...UPLOAD_MIME];

export function blobTokenPresent(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env[BLOB_TOKEN_ENV]?.trim());
}

/** Read the server-only token. Never log, return in JSON, or put in a URL. */
export function requireBlobToken(env: NodeJS.ProcessEnv = process.env): string {
  const token = env[BLOB_TOKEN_ENV]?.trim();
  if (!token) throw new Error("Private object storage is not configured.");
  return token;
}

export function storageHealth(env: NodeJS.ProcessEnv = process.env) {
  return {
    blobReadWriteToken: blobTokenPresent(env),
    access: BLOB_ACCESS,
    heic: "unsupported" as const,
    maxUploadBytes: MAX_UPLOAD_BYTES,
  };
}

export function tokenValidUntil(now = Date.now()): number {
  return now + UPLOAD_TOKEN_TTL_MS;
}
