import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { INVALID_LOGIN_MESSAGE, portalBeforeLoad } from "./guard.ts";
import type { PortalActor } from "./authz.ts";

const owner: PortalActor = {
  userId: "o1",
  email: "owner@example.com",
  role: "owner",
  status: "active",
  displayName: "Owner",
};

describe("portal session guard", () => {
  it("lets login and password-reset pages through without a session", () => {
    assert.equal(
      portalBeforeLoad("/portal/login", "", { ok: false, reason: "unauthenticated" }).kind,
      "public",
    );
    assert.equal(
      portalBeforeLoad("/portal/forgot-password", "", { ok: false, reason: "unauthenticated" }).kind,
      "public",
    );
    assert.equal(
      portalBeforeLoad("/portal/reset-password", "", { ok: false, reason: "unauthenticated" }).kind,
      "public",
    );
  });

  it("redirects a logged-out visitor to login with a safe next path", () => {
    const result = portalBeforeLoad("/portal", "", { ok: false, reason: "unauthenticated" });
    assert.equal(result.kind, "login");
    if (result.kind === "login") assert.equal(result.next, "/portal");
  });

  it("blocks non-owners and disabled accounts from owner routes", () => {
    const forbidden = portalBeforeLoad("/portal/events/new", "", { ok: false, reason: "forbidden" });
    assert.equal(forbidden.kind, "login");
    if (forbidden.kind === "login") assert.equal(forbidden.next, "/portal/events/new");
  });

  it("allows an active owner into protected portal routes", () => {
    const result = portalBeforeLoad("/portal", "", { ok: true, actor: owner });
    assert.equal(result.kind, "allow");
    if (result.kind === "allow") assert.equal(result.actor.userId, "o1");
  });

  it("rejects open redirects on the post-login next path", () => {
    const result = portalBeforeLoad("/portal", "?next=https://evil.example", {
      ok: false,
      reason: "unauthenticated",
    });
    assert.equal(result.kind, "login");
    if (result.kind === "login") assert.equal(result.next, "/portal");
  });

  it("uses a generic invalid-login message", () => {
    assert.equal(INVALID_LOGIN_MESSAGE, "Invalid email or password.");
  });
});
