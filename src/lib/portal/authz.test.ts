import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canPublish,
  canPublishEvent,
  canUploadToEvent,
  isPublicGalleryEvent,
  publicPhotoVisible,
  type PortalActor,
} from "./authz.ts";

const owner: PortalActor = { userId: "o1", email: "owner@example.com", role: "owner", status: "active", displayName: "Owner" };
const photographer: PortalActor = { userId: "p1", email: "photo@example.com", role: "photographer", status: "active", displayName: "Shooter" };

describe("authorization", () => {
  it("lets the owner manage every event", () => {
    assert.equal(canUploadToEvent(owner, [], "evt-1"), true);
    assert.equal(canPublish(owner), true);
  });
  it("blocks photographers from unassigned events and publishing", () => {
    assert.equal(canUploadToEvent(photographer, ["evt-2"], "evt-1"), false);
    assert.equal(canUploadToEvent(photographer, ["evt-1"], "evt-1"), true);
    assert.equal(canPublish(photographer), false);
  });
  it("blocks disabled accounts", () => {
    assert.equal(canUploadToEvent({ ...owner, status: "disabled" }, [], "evt-1"), false);
  });
  it("hides draft, hidden, and failed photos from the public", () => {
    assert.equal(publicPhotoVisible({ eventStatus: "draft", uploadStatus: "ready", hidden: false }), false);
    assert.equal(publicPhotoVisible({ eventStatus: "published", uploadStatus: "ready", hidden: true }), false);
    assert.equal(publicPhotoVisible({ eventStatus: "published", uploadStatus: "failed", hidden: false }), false);
    assert.equal(publicPhotoVisible({ eventStatus: "published", uploadStatus: "ready", hidden: false }), true);
  });
  it("keeps draft and archived events off public listings", () => {
    assert.equal(isPublicGalleryEvent("draft"), false);
    assert.equal(isPublicGalleryEvent("archived"), false);
    assert.equal(isPublicGalleryEvent("published"), true);
  });
  it("requires name, slug, code, and a ready photo to publish", () => {
    assert.equal(canPublishEvent({ name: "Night", slug: "night", eventCode: "ATL-NIGHT", readyPhotoCount: 1 }), null);
    assert.match(canPublishEvent({ name: "Night", slug: "night", eventCode: "ATL-NIGHT", readyPhotoCount: 0 }) ?? "", /ready photo/);
  });
});
