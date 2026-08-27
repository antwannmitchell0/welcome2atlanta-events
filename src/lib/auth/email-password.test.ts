import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { emailAndPasswordEnabled, emailPasswordConfig } from "./email-password.ts";

const here = dirname(fileURLToPath(import.meta.url));

describe("owner email/password config", () => {
  it("enables email/password without public signup or magic links", () => {
    assert.equal(emailAndPasswordEnabled, true);
    assert.equal(emailPasswordConfig.enabled, true);
    assert.equal(emailPasswordConfig.disableSignUp, true);
    assert.equal(emailPasswordConfig.minPasswordLength, 10);
    assert.equal("magicLink" in emailPasswordConfig, false);
  });

  it("wires emailPasswordConfig into the active Better Auth server", () => {
    const server = readFileSync(join(here, "server.ts"), "utf8");
    assert.match(server, /emailAndPasswordEnabled, emailPasswordConfig/);
    assert.match(
      server,
      /\.\.\.\(emailAndPasswordEnabled \? \{ emailAndPassword: emailPasswordConfig \} : \{\}\)/,
    );
    assert.doesNotMatch(server, /magicLink/);
  });
});
