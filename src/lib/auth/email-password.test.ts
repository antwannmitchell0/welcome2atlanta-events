import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emailAndPasswordEnabled, emailPasswordConfig } from "./email-password.ts";

describe("owner email/password config", () => {
  it("enables email/password without public signup or magic links", () => {
    assert.equal(emailAndPasswordEnabled, true);
    assert.equal(emailPasswordConfig.enabled, true);
    assert.equal(emailPasswordConfig.disableSignUp, true);
    assert.equal(emailPasswordConfig.minPasswordLength, 10);
  });
});
