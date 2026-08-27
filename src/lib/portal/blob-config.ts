import { MAX_UPLOAD_BYTES, UPLOAD_MIME } from "./files.ts";

export const BLOB_TOKEN_ENV = "BLOB_READ_WRITE_TOKEN";
export const BLOB_STORE_ID_ENV = "BLOB_STORE_ID";
export const BLOB_OIDC_ENV = "VERCEL_OIDC_TOKEN";
export const BLOB_ACCESS = "private" as const;
export const UPLOAD_TOKEN_TTL_MS = 15 * 60 * 1000;
export const HANDLE_UPLOAD_URL = "/api/portal/upload";
export const ALLOWED_UPLOAD_CONTENT_TYPES = [...UPLOAD_MIME];

/**
 * Static reads so Nitro keeps these secrets in the server env polyfill.
 * Dynamic `process.env[name]` alone is dropped at build. Never log or return
 * the values.
 */
void process.env.BLOB_READ_WRITE_TOKEN;
void process.env.BLOB_STORE_ID;
void process.env.VERCEL_OIDC_TOKEN;

function present(value: string | undefined | null): boolean {
  return Boolean(value?.trim());
}

function read(env: NodeJS.ProcessEnv, name: string): string | undefined {
  const value = env[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function blobTokenPresent(env: NodeJS.ProcessEnv = process.env): boolean {
  return present(read(env, BLOB_TOKEN_ENV));
}

/** True when either a read-write token or OIDC + store id is configured. */
export function blobStoreConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  if (blobTokenPresent(env)) return true;
  return present(read(env, BLOB_STORE_ID_ENV)) && present(read(env, BLOB_OIDC_ENV));
}

/** Read the server-only token. Never log, return in JSON, or put in a URL. */
export function requireBlobToken(env: NodeJS.ProcessEnv = process.env): string {
  const token = read(env, BLOB_TOKEN_ENV);
  if (!token) throw new Error("Private object storage is not configured.");
  return token;
}

export function storageHealth(env: NodeJS.ProcessEnv = process.env) {
  return {
    blobReadWriteToken: blobTokenPresent(env),
    blobStoreId: present(read(env, BLOB_STORE_ID_ENV)),
    vercelOidc: present(read(env, BLOB_OIDC_ENV)),
    configured: blobStoreConfigured(env),
    access: BLOB_ACCESS,
    heic: "unsupported" as const,
    maxUploadBytes: MAX_UPLOAD_BYTES,
  };
}

export function tokenValidUntil(now = Date.now()): number {
  return now + UPLOAD_TOKEN_TTL_MS;
}
