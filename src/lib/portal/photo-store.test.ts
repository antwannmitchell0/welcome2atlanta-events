import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import type { PortalActor } from "./authz.ts";
import { createOwnerEvent, type SqlLike } from "./event-store.ts";
import {
  completePhotoUpload,
  deleteEventPhoto,
  listEventPhotos,
  preparePhotoUpload,
  reorderEventPhotos,
  setPhotoCover,
  setPhotoFlags,
} from "./photo-store.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
const JPEG2 = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2]);

const owner: PortalActor = {
  userId: "owner-1",
  email: "owner@example.com",
  role: "owner",
  status: "active",
  displayName: "Owner",
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

async function readyPhoto(sql: SqlLike, eventId: string, bytes: Uint8Array, filename: string) {
  const prepared = await preparePhotoUpload(sql, owner, [], {
    eventId,
    filename,
    size: bytes.byteLength,
    declaredMime: "image/jpeg",
    checksum: digest(bytes),
  });
  assert.equal(prepared.ok, true);
  if (!prepared.ok) throw new Error("prepare failed");
  await completePhotoUpload(sql, {
    photoId: prepared.photoId,
    pathname: prepared.pathname,
    url: `https://store.private.blob.vercel-storage.com/${prepared.pathname}`,
    bytes,
  });
  return prepared.photoId;
}

describe("photo management", () => {
  it("sets a cover, refuses a hidden cover, and clears cover when hidden", async () => {
    const sql = await portalDb();
    const created = await createOwnerEvent(sql, owner, { name: "Cover Night", eventDate: "2026-09-08" });
    const photoId = await readyPhoto(sql, created.id, JPEG, "a.jpg");
    await setPhotoCover(sql, created.id, photoId);
    const covered = await sql.query<{ cover_photo_id: string | null }>(
      `select cover_photo_id from gallery_event where id = $1`,
      [created.id],
    );
    assert.equal(covered[0]?.cover_photo_id, photoId);
    await setPhotoFlags(sql, photoId, { hidden: true });
    const cleared = await sql.query<{ cover_photo_id: string | null }>(
      `select cover_photo_id from gallery_event where id = $1`,
      [created.id],
    );
    assert.equal(cleared[0]?.cover_photo_id, null);
    await assert.rejects(() => setPhotoCover(sql, created.id, photoId), /visible ready/);
  });

  it("reorders photos and deletes with blob cleanup hooks", async () => {
    const sql = await portalDb();
    const created = await createOwnerEvent(sql, owner, { name: "Order Night", eventDate: "2026-09-09" });
    const first = await readyPhoto(sql, created.id, JPEG, "a.jpg");
    const second = await readyPhoto(sql, created.id, JPEG2, "b.jpg");
    await reorderEventPhotos(sql, created.id, [second, first]);
    const listed = await listEventPhotos(sql, created.id);
    assert.deepEqual(
      listed.map((row) => row.id),
      [second, first],
    );
    const removed: string[] = [];
    await deleteEventPhoto(sql, created.id, first, async (pathname) => {
      removed.push(pathname);
    });
    const after = await listEventPhotos(sql, created.id);
    assert.equal(after.length, 1);
    assert.equal(after[0]?.id, second);
    assert.ok(removed.length >= 1);
  });
});
