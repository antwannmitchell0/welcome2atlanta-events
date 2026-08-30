import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { claimOwnerError, emailsMatch, MIN_OWNER_PASSWORD } from "./claim-owner.ts";
import { LOGIN_NOT_READY_MESSAGE } from "./guard.ts";

describe("first-owner claim", () => {
  it("matches owner email case-insensitively", () => {
    assert.equal(emailsMatch("Owner@Example.COM", "owner@example.com"), true);
    assert.equal(emailsMatch("a@x.com", "b@x.com"), false);
  });

  it("refuses to claim without a live database", () => {
    assert.equal(
      claimOwnerError({
        databaseConfigured: false,
        configuredEmail: "owner@example.com",
        submittedEmail: "owner@example.com",
        password: "long-enough-password",
        ownerExists: false,
      }),
      LOGIN_NOT_READY_MESSAGE,
    );
  });

  it("requires the saved owner email and a 10+ character password", () => {
    const base = {
      databaseConfigured: true,
      configuredEmail: "owner@example.com",
      submittedEmail: "owner@example.com",
      password: "long-enough-password",
      ownerExists: false,
    };
    assert.equal(claimOwnerError(base), null);
    assert.equal(
      claimOwnerError({ ...base, submittedEmail: "other@example.com" }),
      "Use the owner email saved on the live site.",
    );
    assert.equal(
      claimOwnerError({ ...base, password: "short" }),
      `Password must be at least ${MIN_OWNER_PASSWORD} characters.`,
    );
    assert.equal(
      claimOwnerError({ ...base, ownerExists: true }),
      "Owner login is already set up. Sign in instead.",
    );
    assert.equal(
      claimOwnerError({ ...base, configuredEmail: undefined }),
      "Owner email is not saved on the live site yet.",
    );
  });
});
