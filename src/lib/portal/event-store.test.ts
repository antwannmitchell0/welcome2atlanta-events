import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { isPublicGalleryEvent, type PortalActor } from "./authz.ts";
import { parseEventInput } from "./event-input.ts";
import {
  createOwnerEvent,
  getOwnerEvent,
  getPublishedEventByCode,
  getPublishedEventBySlug,
  listOwnerEvents,
  listPublishedEvents,
  setOwnerEventStatus,
  type SqlLike,
  updateOwnerEvent,
} from "./event-store.ts";
import { assertOwner } from "./session.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
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
  await pg.exec(readFileSync(join(root, "migrations/0004_coverage_requests.sql"), "utf8"));
  return sqlFrom(pg);
}

describe("event input", () => {
  it("requires a name and date", () => {
    const parsed = parseEventInput({ name: "A", eventDate: "" });
    assert.equal(parsed.ok, false);
  });

  it("accepts a valid create payload", () => {
    const parsed = parseEventInput({
      name: "Portal Upload Test",
      eventDate: "2026-09-01",
      venue: "Midtown",
    });
    assert.equal(parsed.ok, true);
  });
});

describe("owner event store", () => {
  it("creates a draft with unique slug, code, and zero photo counts", async () => {
    const sql = await portalDb();
    const created = await createOwnerEvent(sql, owner, {
      name: "Portal Upload Test",
      eventDate: "2026-09-01",
      venue: "Midtown Lounge",
      neighborhood: "Midtown",
      description: "Owner portal verification night.",
    });
    assert.equal(created.status, "draft");
    assert.match(created.slug, /portal-upload-test/);
    assert.match(created.eventCode, /^ATL-/);
    const event = await getOwnerEvent(sql, created.id);
    assert.ok(event);
    assert.equal(event?.photo_count, 0);
    assert.equal(event?.failed_count, 0);
    assert.equal(event?.status, "draft");
  });

  it("rejects duplicate slugs and sample gallery codes", async () => {
    const sql = await portalDb();
    await createOwnerEvent(sql, owner, {
      name: "Night One",
      slug: "night-one",
      eventDate: "2026-09-01",
    });
    await assert.rejects(
      () =>
        createOwnerEvent(sql, owner, {
          name: "Night One Again",
          slug: "night-one",
          eventDate: "2026-09-02",
        }),
      /slug is already in use/,
    );
    await assert.rejects(
      () =>
        createOwnerEvent(sql, owner, {
          name: "Copycat",
          eventCode: "ATL-404",
          eventDate: "2026-09-03",
        }),
      /event code is already in use/,
    );
  });

  it("keeps drafts off the public list", async () => {
    const sql = await portalDb();
    const created = await createOwnerEvent(sql, owner, {
      name: "Hidden Draft",
      eventDate: "2026-09-04",
    });
    const listed = await listOwnerEvents(sql);
    assert.equal(listed.some((event) => event.id === created.id), true);
    const published = await listPublishedEvents(sql);
    assert.equal(published.some((event) => event.id === created.id), false);
    assert.equal(isPublicGalleryEvent("draft"), false);
    assert.equal(isPublicGalleryEvent("archived"), false);
    assert.equal(isPublicGalleryEvent("published"), true);
    assert.equal(await getPublishedEventBySlug(sql, created.slug), null);
    assert.equal(await getPublishedEventByCode(sql, created.eventCode), null);
  });


  it("refuses to publish without a ready visible photo", async () => {
    const sql = await portalDb();
    const created = await createOwnerEvent(sql, owner, {
      name: "Unready Night",
      eventDate: "2026-09-05",
    });
    await assert.rejects(() => setOwnerEventStatus(sql, created.id, "published"), /ready photo/);
  });

  it("updates fields without colliding with sample slugs", async () => {
    const sql = await portalDb();
    const created = await createOwnerEvent(sql, owner, {
      name: "Editable Night",
      eventDate: "2026-09-06",
    });
    const updated = await updateOwnerEvent(sql, created.id, {
      name: "Editable Night",
      slug: "editable-night",
      eventDate: "2026-09-07",
      venue: "Ponce",
    });
    assert.equal(updated.slug, "editable-night");
    await assert.rejects(
      () =>
        updateOwnerEvent(sql, created.id, {
          name: "Clash",
          slug: "404-after-dark",
          eventDate: "2026-09-07",
        }),
      /slug is already in use/,
    );
  });
});

describe("owner authorization", () => {
  it("blocks anonymous and non-owner actors from mutations", () => {
    assert.throws(() => assertOwner({ ok: false, reason: "unauthenticated" }), /Unauthorized/);
    assert.throws(() => assertOwner({ ok: false, reason: "forbidden" }), /Forbidden/);
    const actor = assertOwner({
      ok: true,
      actor: owner,
    });
    assert.equal(actor.role, "owner");
  });
});
