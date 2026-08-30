import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PortalActor } from "./authz.ts";
import { mediaPathForAccess, resolveMediaAccess } from "./media-access.ts";
import type { GalleryPhotoRow } from "./photo-store.ts";

const owner: PortalActor = {
  userId: "owner-1",
  email: "owner@example.com",
  role: "owner",
  status: "active",
  displayName: "Owner",
};

function photo(overrides: Partial<GalleryPhotoRow> = {}): GalleryPhotoRow {
  return {
    id: "p1",
    event_id: "e1",
    storage_key: "events/e1/p1.jpg",
    derivative_key: "events/e1/p1.public.jpg",
    original_filename: "a.jpg",
    display_filename: "a.jpg",
    mime_type: "image/jpeg",
    file_size: 12,
    width: 3,
    height: 2,
    checksum: "a".repeat(64),
    upload_status: "ready",
    processing_error: null,
    sort_order: 1,
    featured: false,
    hidden: false,
    uploaded_by: "owner-1",
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("media access", () => {
  it("serves a ready photo on a published event to the public", () => {
    const access = resolveMediaAccess({ photo: photo(), eventStatus: "published", actor: null });
    assert.deepEqual(access, { ok: true, mode: "public" });
  });

  it("hides draft, hidden, and unpublished photos from the public", () => {
    assert.equal(resolveMediaAccess({ photo: photo(), eventStatus: "draft", actor: null }).ok, false);
    assert.equal(
      resolveMediaAccess({ photo: photo({ hidden: true }), eventStatus: "published", actor: null }).ok,
      false,
    );
    assert.equal(
      resolveMediaAccess({ photo: photo({ upload_status: "uploading" }), eventStatus: "published", actor: null }).ok,
      false,
    );
    assert.equal(resolveMediaAccess({ photo: null, eventStatus: "published", actor: null }).ok, false);
  });

  it("lets an owner preview draft photos without leaking them as public", () => {
    const access = resolveMediaAccess({ photo: photo(), eventStatus: "draft", actor: owner });
    assert.deepEqual(access, { ok: true, mode: "owner" });
    const denied = resolveMediaAccess({ photo: photo(), eventStatus: "draft", actor: null });
    assert.equal(denied.ok, false);
    if (!denied.ok) assert.equal(denied.status, 404);
  });

  it("returns 403 for a logged-in non-owner on a private photo", () => {
    const photographer: PortalActor = {
      userId: "ph1",
      email: "p@x.com",
      role: "photographer",
      status: "active",
      displayName: "P",
    };
    const access = resolveMediaAccess({ photo: photo(), eventStatus: "draft", actor: photographer });
    assert.equal(access.ok, false);
    if (!access.ok) assert.equal(access.status, 403);
  });

  it("never points the public at the private original path", () => {
    const row = photo();
    assert.equal(mediaPathForAccess(row, "public"), row.derivative_key);
    assert.notEqual(mediaPathForAccess(row, "public"), row.storage_key);
    assert.equal(mediaPathForAccess(row, "owner"), row.storage_key);
  });

});
