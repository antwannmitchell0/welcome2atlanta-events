import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loginCopy, loginHealthFromEnv } from "./login-health.ts";

describe("owner login health", () => {
  it("never treats a missing database as a credential failure", () => {
    const health = loginHealthFromEnv({}, false);
    assert.equal(health.database, false);
    assert.equal(health.canSignIn, false);
    assert.equal(health.canClaim, false);
    assert.equal(health.resendConfigured, false);
    const copy = loginCopy(health);
    assert.equal(copy.mode, "not-ready");
    assert.match(copy.detail, /not an email or password/i);
    assert.match(copy.detail, /does not use Resend/i);
  });

  it("lets the first matching owner claim after the database is connected", () => {
    const health = loginHealthFromEnv(
      {
        DATABASE_URL: "postgresql://example",
        WTAE_OWNER_EMAIL: "owner@example.com",
        BETTER_AUTH_SECRET: "x".repeat(32),
      },
      false,
    );
    assert.equal(health.canClaim, true);
    assert.equal(health.canSignIn, false);
    assert.equal(loginCopy(health).mode, "claim");
  });

  it("switches to sign-in once an owner exists", () => {
    const health = loginHealthFromEnv(
      {
        DATABASE_URL: "postgresql://example",
        WTAE_OWNER_EMAIL: "owner@example.com",
        BETTER_AUTH_SECRET: "x".repeat(32),
      },
      true,
    );
    assert.equal(health.canSignIn, true);
    assert.equal(health.canClaim, false);
    assert.equal(health.ownerExists, true);
    assert.equal(loginCopy(health).mode, "signin");
    assert.match(loginCopy(health).detail, /Resend is not required/i);
  });

  it("does not claim when the owner email is missing", () => {
    const health = loginHealthFromEnv({ DATABASE_URL: "postgresql://example" }, false);
    assert.equal(health.canClaim, false);
    assert.equal(loginCopy(health).mode, "not-ready");
    assert.match(loginCopy(health).detail, /owner email/i);
  });

  it("treats whitespace env as unset", () => {
    const health = loginHealthFromEnv(
      { DATABASE_URL: "  ", WTAE_OWNER_EMAIL: "\n" },
      true,
    );
    assert.equal(health.database, false);
    assert.equal(health.ownerExists, false);
    assert.equal(health.canSignIn, false);
  });
});
