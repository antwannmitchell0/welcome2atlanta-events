import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it, before } from "node:test";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import type { PortalActor } from "./authz.ts";
import { blobTokenPresent, storageHealth } from "./blob-config.ts";
import { claimedUploadExt, detectImageSignature, isDangerousUpload, MAX_UPLOAD_BYTES } from "./files.ts";
import { createOwnerEvent, type SqlLike } from "./event-store.ts";
import { completePhotoUpload, preparePhotoUpload, sha256Hex } from "./photo-store.ts";
import { assertAuthorizedPath, buildOriginalPath, isPublicBlobUrl, parseOriginalPath } from "./storage-path.ts";
import { assertUploader, resolveUploadActor } from "./upload-actor.ts";
import { authorizeClientPath, createUploadGrant, finishConfirmedUpload } from "./upload-grant.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const SVG = new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>........");

const owner: PortalActor = {
  userId: "owner-1",
  email: "owner@example.com",
  role: "owner",
  status: "active",
  displayName: "Owner",
};
const photographer: PortalActor = {
  userId: "photo-1",
  email: "photo@example.com",
  role: "photographer",
  status: "active",
  displayName: "Shooter",
};

function sqlFrom(pg: PGlite): SqlLike {
  return {
    async query<T>(text: string, params: unknown[] = []) {
      const result = await pg.query<T>(text, params);
      return result.rows;
    },
  };
}

async function portalDb() {
  const pg = new PGlite();
  await pg.exec(readFileSync(join(root, "migrations/0001_auth.sql"), "utf8"));
  await pg.exec(readFileSync(join(root, "migrations/0002_owner_portal.sql"), "utf8"));
  await pg.exec(readFileSync(join(root, "migrations/0003_drop_storage_object.sql"), "utf8"));
  return sqlFrom(pg);
}

function digest(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

describe("storage health", () => {
  it("reports the token name as present or absent without a value", () => {
    const off = storageHealth({} as NodeJS.ProcessEnv);
    assert.equal(off.blobReadWriteToken, false);
    assert.equal(off.configured, false);
    assert.equal(off.access, "private");
    assert.equal(JSON.stringify(off).includes("vercel_blob"), false);
    const secret = "test-not-a-real-token-value-xyz";
    const on = storageHealth({ BLOB_READ_WRITE_TOKEN: secret } as NodeJS.ProcessEnv);
    assert.equal(on.blobReadWriteToken, true);
    assert.equal(on.configured, true);
    assert.equal(Object.keys(on).includes("blobReadWriteToken"), true);
    assert.equal(JSON.stringify(on).includes(secret), false);
    const oidc = storageHealth({
      BLOB_STORE_ID: "store_test",
      VERCEL_OIDC_TOKEN: "oidc-test-not-a-real-token",
    } as NodeJS.ProcessEnv);
    assert.equal(oidc.blobReadWriteToken, false);
    assert.equal(oidc.configured, true);
    assert.equal(oidc.uploadMode, "presigned");
    assert.equal(JSON.stringify(oidc).includes("oidc-test-not-a-real-token"), false);
    const vercelStore = storageHealth({
      BLOB_STORE_ID: "store_test",
      VERCEL: "1",
    } as NodeJS.ProcessEnv);
    assert.equal(vercelStore.configured, true);
    assert.equal(vercelStore.blobReadWriteToken, false);
    assert.equal(vercelStore.uploadMode, "presigned");
    assert.equal(vercelStore.access, "private");


  });
});

describe("storage paths", () => {
  it("builds a server-controlled object key", () => {
    const eventId = "11111111-1111-4111-8111-111111111111";
    const photoId = "22222222-2222-4222-8222-222222222222";
    const path = buildOriginalPath(eventId, photoId, "jpg");
    assert.equal(path, `events/${eventId}/${photoId}.jpg`);
    assert.deepEqual(parseOriginalPath(path), { eventId, photoId, ext: "jpg" });
  });

  it("rejects client-controlled or public locations", () => {
    const eventId = "11111111-1111-4111-8111-111111111111";
    const photoId = "22222222-2222-4222-8222-222222222222";
    assert.throws(
      () => assertAuthorizedPath(`events/${eventId}/33333333-3333-4333-8333-333333333333.jpg`, eventId, photoId),
      /not authorized/,
    );
    assert.equal(isPublicBlobUrl("https://abc.public.blob.vercel-storage.com/events/x.jpg"), true);
  });
});

describe("upload grants", () => {
  before(() => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-not-a-real-token";
  });

  it("blocks logged-out, disabled, and public callers from a grant", () => {
    assert.throws(() => assertUploader(resolveUploadActor({ user: null, profile: null })), /Unauthorized/);
    assert.throws(
      () =>
        assertUploader(
          resolveUploadActor({
            user: { id: "x", email: "x@x.com" },
            profile: { role: "owner", status: "disabled", display_name: "X" },
          }),
        ),
      /Forbidden/,
    );
    const publicUser = resolveUploadActor({
      user: { id: "p", email: "guest@x.com" },
      profile: null,
    });
    assert.equal(publicUser.ok, false);
  });

  it("lets an owner prepare a grant and rejects a photographer on an unassigned event", async () => {
    const sql = await portalDb();
    const created = await createOwnerEvent(sql, owner, { name: "Upload Night", eventDate: "2026-09-01" });
    const grant = await createUploadGrant(sql, owner, [], {
      eventId: created.id,
      filename: "room.jpg",
      size: JPEG.byteLength,
      declaredMime: "image/jpeg",
      checksum: digest(JPEG),
    });
    assert.equal(grant.ok, true);
    if (!grant.ok) return;
    assert.equal(grant.pathname, buildOriginalPath(created.id, grant.photoId, "jpg"));
    assert.equal(grant.access, "private");
    assert.equal(grant.uploadMode === "client-token" || grant.uploadMode === "presigned", true);
    assert.equal("token" in grant, false);

    const denied = await createUploadGrant(sql, photographer, [], {
      eventId: created.id,
      filename: "room.jpg",
      size: JPEG.byteLength,
      declaredMime: "image/jpeg",
      checksum: digest(PNG),
    });
    assert.equal(denied.ok, false);
    if (!denied.ok) assert.equal(denied.message, "Forbidden");
  });

  it("lets an assigned photographer prepare, and rejects spoofed or oversized files", async () => {
    const sql = await portalDb();
    const created = await createOwnerEvent(sql, owner, { name: "Assigned Night", eventDate: "2026-09-02" });
    await sql.query(
      `insert into event_assignment (id, event_id, photographer_user_id, assignment_status)
       values ('asg-1', $1, $2, 'active')`,
      [created.id, photographer.userId],
    );
    const ok = await createUploadGrant(sql, photographer, [created.id], {
      eventId: created.id,
      filename: "ok.png",
      size: PNG.byteLength,
      declaredMime: "image/png",
      checksum: digest(PNG),
    });
    assert.equal(ok.ok, true);

    const spoofed = await createUploadGrant(sql, owner, [], {
      eventId: created.id,
      filename: "payload.jpg.svg",
      size: 12,
      declaredMime: "image/jpeg",
      checksum: digest(JPEG),
    });
    assert.equal(spoofed.ok, false);

    const huge = await createUploadGrant(sql, owner, [], {
      eventId: created.id,
      filename: "big.jpg",
      size: MAX_UPLOAD_BYTES + 1,
      declaredMime: "image/jpeg",
      checksum: digest(JPEG),
    });
    assert.equal(huge.ok, false);

    const heic = await createUploadGrant(sql, owner, [], {
      eventId: created.id,
      filename: "iphone.heic",
      size: 20,
      declaredMime: "image/heic",
      checksum: digest(JPEG),
    });
    assert.equal(heic.ok, false);
    if (!heic.ok) assert.match(heic.message, /HEIC/);
  });

  it("rejects a client-supplied storage path that does not match the grant", async () => {
    const sql = await portalDb();
    const created = await createOwnerEvent(sql, owner, { name: "Path Night", eventDate: "2026-09-03" });
    const grant = await createUploadGrant(sql, owner, [], {
      eventId: created.id,
      filename: "room.jpg",
      size: JPEG.byteLength,
      declaredMime: "image/jpeg",
      checksum: digest(JPEG),
    });
    assert.equal(grant.ok, true);
    if (!grant.ok) return;
    await assert.rejects(
      () =>
        authorizeClientPath(
          sql,
          owner,
          [],
          `events/${created.id}/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg`,
          JSON.stringify({ photoId: grant.photoId }),
        ),
      /not authorized/,
    );
    const options = await authorizeClientPath(
      sql,
      owner,
      [],
      grant.pathname,
      JSON.stringify({ photoId: grant.photoId }),
    );
    assert.equal(options.addRandomSuffix, false);
    assert.equal(options.allowOverwrite, false);
    assert.deepEqual(options.allowedContentTypes, ["image/jpeg", "image/png", "image/webp"]);
    assert.equal(options.maximumSizeInBytes, MAX_UPLOAD_BYTES);
    assert.equal(JSON.parse(options.tokenPayload).storageKey, grant.pathname);
    assert.equal("token" in options, false);
  });

  it("detects duplicates and treats completion as idempotent", async () => {
    const sql = await portalDb();
    const created = await createOwnerEvent(sql, owner, { name: "Dup Night", eventDate: "2026-09-04" });
    const checksum = digest(JPEG);
    const first = await preparePhotoUpload(sql, owner, [], {
      eventId: created.id,
      filename: "a.jpg",
      size: JPEG.byteLength,
      declaredMime: "image/jpeg",
      checksum,
    });
    assert.equal(first.ok, true);
    if (!first.ok) return;
    const url = `https://store.private.blob.vercel-storage.com/${first.pathname}`;
    const once = await completePhotoUpload(sql, {
      photoId: first.photoId,
      pathname: first.pathname,
      url,
      bytes: JPEG,
    });
    assert.equal(once.status, "ready");
    const twice = await completePhotoUpload(sql, {
      photoId: first.photoId,
      pathname: first.pathname,
      url,
      bytes: JPEG,
    });
    assert.equal(twice.status, "ready");
    const dup = await preparePhotoUpload(sql, owner, [], {
      eventId: created.id,
      filename: "b.jpg",
      size: JPEG.byteLength,
      declaredMime: "image/jpeg",
      checksum,
    });
    assert.equal(dup.ok, false);
    if (!dup.ok) assert.equal(dup.code, "duplicate");
  });

  it("fails one file without blocking another in the same event", async () => {
    const sql = await portalDb();
    const created = await createOwnerEvent(sql, owner, { name: "Batch Night", eventDate: "2026-09-05" });
    const good = await preparePhotoUpload(sql, owner, [], {
      eventId: created.id,
      filename: "good.jpg",
      size: JPEG.byteLength,
      declaredMime: "image/jpeg",
      checksum: digest(JPEG),
    });
    const bad = await preparePhotoUpload(sql, owner, [], {
      eventId: created.id,
      filename: "bad.jpg",
      size: SVG.byteLength,
      declaredMime: "image/jpeg",
      checksum: digest(SVG),
    });
    assert.equal(good.ok && bad.ok, true);
    if (!good.ok || !bad.ok) return;
    await assert.rejects(
      () =>
        finishConfirmedUpload(sql, {
          pathname: bad.pathname,
          url: `https://store.private.blob.vercel-storage.com/${bad.pathname}`,
          tokenPayload: JSON.stringify({ photoId: bad.photoId, storageKey: bad.pathname }),
          bytes: SVG,
        }),
      /supported image/,
    );
    const saved = await finishConfirmedUpload(sql, {
      pathname: good.pathname,
      url: `https://store.private.blob.vercel-storage.com/${good.pathname}`,
      tokenPayload: JSON.stringify({ photoId: good.photoId, storageKey: good.pathname }),
      bytes: JPEG,
    });
    assert.equal(saved.status, "ready");
  });

  it("rejects a public blob URL on completion", async () => {
    const sql = await portalDb();
    const created = await createOwnerEvent(sql, owner, { name: "Public Night", eventDate: "2026-09-06" });
    const grant = await preparePhotoUpload(sql, owner, [], {
      eventId: created.id,
      filename: "a.jpg",
      size: JPEG.byteLength,
      declaredMime: "image/jpeg",
      checksum: digest(JPEG),
    });
    assert.equal(grant.ok, true);
    if (!grant.ok) return;
    await assert.rejects(
      () =>
        completePhotoUpload(sql, {
          photoId: grant.photoId,
          pathname: grant.pathname,
          url: `https://store.public.blob.vercel-storage.com/${grant.pathname}`,
          bytes: JPEG,
        }),
      /Public Blob/,
    );
  });
});

describe("claimed uploads", () => {
  it("rejects spoofed extensions, HEIC, and unsupported MIME types", () => {
    assert.equal(isDangerousUpload("photo.svg", "image/svg+xml"), true);
    assert.equal(claimedUploadExt("virus.exe", "image/jpeg").ok, false);
    assert.equal(claimedUploadExt("shot.heic", "image/heic").ok, false);
    assert.equal(claimedUploadExt("shot.webp", "image/webp").ok, true);
    assert.equal(detectImageSignature(JPEG)?.mime, "image/jpeg");
    assert.equal(blobTokenPresent({} as NodeJS.ProcessEnv), false);
    assert.equal(sha256Hex(JPEG).length, 64);
  });
});
