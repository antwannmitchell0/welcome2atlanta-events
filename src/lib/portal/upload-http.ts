import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import type { AccountStatus, PortalRole } from "./authz.ts";
import { blobStoreConfigured, storageHealth } from "./blob-config.ts";
import { readPrivateBlob, deletePrivateBlob } from "./blob-io.ts";
import { failPhoto, recordUploadFailure } from "./photo-store.ts";
import { resolveUploadActor, assertUploader, loadAssignedEventIds } from "./upload-actor.ts";
import {
  authorizeClientPath,
  createUploadGrant,
  finishConfirmedUpload,
  isHandleUploadBody,
} from "./upload-grant.ts";
import { parseTokenPayload } from "./upload-grant.ts";

async function sql() {
  const { getSql } = await import("@/lib/db");
  return getSql();
}

async function currentUploader() {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const user = await getSessionUser();
  if (!user) return { result: resolveUploadActor({ user: null, profile: null }), user: null };
  try {
    const db = await sql();
    const rows = await db.query<{
      role: PortalRole;
      status: AccountStatus;
      display_name: string;
    }>(`select role, status, display_name from user_profile where user_id = $1`, [user.id]);
    return { result: resolveUploadActor({ user, profile: rows[0] ?? null }), user };
  } catch {
    return { result: resolveUploadActor({ user, profile: null }), user };
  }
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function errorStatus(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden") return 403;
  if (message.includes("not configured")) return 503;
  return 400;
}

export function storageHealthResponse() {
  return json(storageHealth());
}

export async function handlePortalUploadPost(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  if (body && typeof body === "object" && (body as { intent?: unknown }).intent === "prepare") {
    return handlePrepare(body);
  }

  if (!isHandleUploadBody(body)) {
    return json({ error: "Invalid request." }, 400);
  }

  if (!blobStoreConfigured()) {
    return json({ error: "Private object storage is not configured." }, 503);
  }

  try {
    const jsonResponse = await handleUpload({
      body: body as HandleUploadBody,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const { result } = await currentUploader();
        const actor = assertUploader(result);
        const db = await sql();
        const assigned = await loadAssignedEventIds(db, actor.userId);
        return authorizeClientPath(db, actor, assigned, pathname, clientPayload);
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const db = await sql();
        try {
          const bytes = await readPrivateBlob(blob.pathname);
          if (!bytes) throw new Error("Uploaded object was not found.");
          await finishConfirmedUpload(db, {
            pathname: blob.pathname,
            url: blob.url,
            tokenPayload,
            bytes,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Upload failed.";
          try {
            const payload = parseTokenPayload(tokenPayload);
            await failPhoto(db, payload.photoId, message);
          } catch {
            /* photo id unknown */
          }
          try {
            await deletePrivateBlob(blob.pathname);
          } catch {
            /* ignore cleanup */
          }
          throw err;
        }
      },
    });
    return json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload rejected.";
    return json({ error: message }, errorStatus(message));
  }
}

async function handlePrepare(body: unknown): Promise<Response> {
  const payload = body as {
    eventId?: unknown;
    filename?: unknown;
    size?: unknown;
    mime?: unknown;
    checksum?: unknown;
  };
  const { result, user } = await currentUploader();
  try {
    const actor = assertUploader(result);
    const db = await sql();
    const assigned = await loadAssignedEventIds(db, actor.userId);
    const grant = await createUploadGrant(db, actor, assigned, {
      eventId: String(payload.eventId ?? ""),
      filename: String(payload.filename ?? ""),
      size: Number(payload.size ?? 0),
      declaredMime: String(payload.mime ?? ""),
      checksum: String(payload.checksum ?? ""),
    });
    if (!grant.ok) {
      await recordUploadFailure(db, {
        eventId: typeof payload.eventId === "string" ? payload.eventId : undefined,
        userId: actor.userId,
        filename: String(payload.filename ?? "unknown"),
        message: grant.message,
      });
      const status = grant.message === "Forbidden" ? 403 : 400;
      return json({ error: grant.message, code: grant.code }, status);
    }
    return json({
      photoId: grant.photoId,
      pathname: grant.pathname,
      handleUploadUrl: grant.handleUploadUrl,
      access: grant.access,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload rejected.";
    if (user) {
      try {
        await recordUploadFailure(await sql(), {
          userId: user.id,
          filename: String(payload.filename ?? "unknown"),
          message,
        });
      } catch {
        /* ignore */
      }
    }
    return json({ error: message }, errorStatus(message));
  }
}
