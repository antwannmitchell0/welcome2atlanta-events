import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolvePortalMe } from "./session.ts";

const ownerProfile = { role: "owner" as const, status: "active" as const, display_name: "Owner" };
const user = { id: "u1", email: "owner@example.com" };

describe("resolvePortalMe", () => {
  it("rejects a logged-out visitor", () => {
    const me = resolvePortalMe({ user: null, profile: ownerProfile });
    assert.equal(me.ok, false);
    if (!me.ok) assert.equal(me.reason, "unauthenticated");
  });

  it("blocks a photographer from owner routes", () => {
    const me = resolvePortalMe({
      user,
      profile: { role: "photographer", status: "active", display_name: "Shooter" },
    });
    assert.equal(me.ok, false);
    if (!me.ok) assert.equal(me.reason, "forbidden");
  });

  it("blocks a disabled owner", () => {
    const me = resolvePortalMe({
      user,
      profile: { role: "owner", status: "disabled", display_name: "Owner" },
    });
    assert.equal(me.ok, false);
    if (!me.ok) assert.equal(me.reason, "forbidden");
  });

  it("allows an active owner", () => {
    const me = resolvePortalMe({ user, profile: ownerProfile });
    assert.equal(me.ok, true);
    if (me.ok) {
      assert.equal(me.actor.role, "owner");
      assert.equal(me.actor.status, "active");
      assert.equal(me.actor.userId, "u1");
    }
  });
});
