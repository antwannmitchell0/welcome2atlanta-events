import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  PORTAL_PROTECTED_FNS,
  evaluateAccess,
  evaluateClaim,
  isClaimSecretConfigured,
  parseFounderEmails,
  readFounderConfig,
  secretsMatch,
} from "./founder-auth.ts";

const secret = "wtae-founder-claim-secret-24plus";
const config = {
  claimSecret: secret,
  allowedEmails: ["founder@welcome2atlantaevents.com"],
};
const open = { founderUserIds: [] as string[], bootstrapClosed: false, claimedUserId: null };
const closed = {
  founderUserIds: ["founder-1"],
  bootstrapClosed: true,
  claimedUserId: "founder-1",
};

describe("founder emails", () => {
  it("parses and lowercases a comma list", () => {
    assert.deepEqual(parseFounderEmails("A@X.com, b@y.com"), ["a@x.com", "b@y.com"]);
  });

  it("ignores junk", () => {
    assert.deepEqual(parseFounderEmails("not-an-email, , hello"), []);
  });
});

describe("claim secret", () => {
  it("rejects short secrets", () => {
    assert.equal(isClaimSecretConfigured("short"), false);
    assert.equal(isClaimSecretConfigured(secret), true);
  });

  it("compares in constant time and fails closed on mismatch", () => {
    assert.equal(secretsMatch(secret, secret), true);
    assert.equal(secretsMatch("definitely-the-wrong-secret-value", secret), false);
    assert.equal(secretsMatch(secret, null), false);
    assert.equal(secretsMatch(null, secret), false);
  });
});

describe("unauthenticated user rejected", () => {
  it("denies access without a user id", () => {
    const access = evaluateAccess({ userId: null, config, state: open });
    assert.equal(access.status, "denied");
    assert.equal(access.reason, "unauthenticated");
  });

  it("rejects a claim without a user id", () => {
    const claim = evaluateClaim({
      userId: null,
      email: "founder@welcome2atlantaevents.com",
      providedSecret: secret,
      config,
      state: open,
    });
    assert.equal(claim.ok, false);
    if (!claim.ok) assert.equal(claim.reason, "unauthenticated");
  });
});

describe("unauthorized authenticated user rejected", () => {
  it("does not auto-promote the first signed-in user", () => {
    const access = evaluateAccess({ userId: "random-public-user", config, state: open });
    assert.equal(access.status, "claim-required");
    const claim = evaluateClaim({
      userId: "random-public-user",
      email: "stranger@example.com",
      providedSecret: "",
      config,
      state: open,
    });
    assert.equal(claim.ok, false);
    if (!claim.ok) assert.equal(claim.reason, "not-authorized");
  });

  it("rejects a wrong secret", () => {
    const claim = evaluateClaim({
      userId: "random-public-user",
      email: "stranger@example.com",
      providedSecret: "wrong-secret-that-is-long-enough",
      config,
      state: open,
    });
    assert.equal(claim.ok, false);
    if (!claim.ok) assert.equal(claim.reason, "invalid-secret");
  });

  it("fails closed when bootstrap is unconfigured", () => {
    const empty = { claimSecret: null, allowedEmails: [] as string[] };
    const access = evaluateAccess({ userId: "anyone", config: empty, state: open });
    assert.equal(access.status, "denied");
    const claim = evaluateClaim({
      userId: "anyone",
      email: "anyone@example.com",
      providedSecret: "whatever",
      config: empty,
      state: open,
    });
    assert.equal(claim.ok, false);
    if (!claim.ok) assert.equal(claim.reason, "bootstrap-unconfigured");
  });
});

describe("authorized founder accepted", () => {
  it("accepts an existing founder without another claim", () => {
    const access = evaluateAccess({ userId: "founder-1", config, state: closed });
    assert.equal(access.status, "granted");
    const claim = evaluateClaim({
      userId: "founder-1",
      email: "founder@welcome2atlantaevents.com",
      providedSecret: "",
      config,
      state: closed,
    });
    assert.equal(claim.ok, true);
    if (claim.ok) assert.equal(claim.reason, "already-founder");
  });

  it("accepts the allowlisted email during open bootstrap", () => {
    const claim = evaluateClaim({
      userId: "founder-1",
      email: "FOUNDER@welcome2atlantaevents.com",
      providedSecret: "",
      config,
      state: open,
    });
    assert.equal(claim.ok, true);
    if (claim.ok) assert.equal(claim.reason, "email-allowlist");
  });

  it("accepts the one-time claim secret during open bootstrap", () => {
    const claim = evaluateClaim({
      userId: "founder-1",
      email: "ops@example.com",
      providedSecret: secret,
      config,
      state: open,
    });
    assert.equal(claim.ok, true);
    if (claim.ok) assert.equal(claim.reason, "claim-secret");
  });
});

describe("second user cannot become founder", () => {
  it("rejects another authenticated user after bootstrap closes", () => {
    const access = evaluateAccess({ userId: "second-user", config, state: closed });
    assert.equal(access.status, "denied");
    const bySecret = evaluateClaim({
      userId: "second-user",
      email: "second@example.com",
      providedSecret: secret,
      config,
      state: closed,
    });
    assert.equal(bySecret.ok, false);
    if (!bySecret.ok) assert.equal(bySecret.reason, "bootstrap-closed");
    const byEmail = evaluateClaim({
      userId: "second-user",
      email: "founder@welcome2atlantaevents.com",
      providedSecret: "",
      config,
      state: closed,
    });
    assert.equal(byEmail.ok, false);
    if (!byEmail.ok) assert.equal(byEmail.reason, "bootstrap-closed");
  });
});

describe("direct server-function calls cannot bypass the portal UI", () => {
  it("keeps every portal data function behind auth middleware and requireFounder", () => {
    const src = readFileSync(new URL("./wtae-data.ts", import.meta.url), "utf8");
    const requireStart = src.indexOf("async function requireFounder");
    const requireNext = src.indexOf("export const ", requireStart);
    const requireBlock = src.slice(requireStart, requireNext === -1 ? undefined : requireNext);
    assert.match(requireBlock, /throw new Error\(FOUNDER_FORBIDDEN\)/);
    assert.doesNotMatch(requireBlock, /insert into founders/);
    assert.doesNotMatch(src, /first signed-in user/i);
    for (const name of PORTAL_PROTECTED_FNS) {
      const start = src.indexOf(`export const ${name}`);
      assert.notEqual(start, -1, `${name} is missing`);
      const next = src.indexOf("export const ", start + 1);
      const block = src.slice(start, next === -1 ? undefined : next);
      assert.match(block, /\.middleware\(\[authMiddleware\]\)/, `${name} must use authMiddleware`);
      assert.match(block, /await requireFounder\(context\.userId\)/, `${name} must call requireFounder`);
    }
    const claimStart = src.indexOf("export const claimFounder");
    const claimNext = src.indexOf("export const ", claimStart + 1);
    const claimBlock = src.slice(claimStart, claimNext === -1 ? undefined : claimNext);
    assert.match(claimBlock, /\.middleware\(\[authMiddleware\]\)/);
    assert.match(claimBlock, /evaluateClaim/);
    assert.doesNotMatch(claimBlock, /await requireFounder/);
  });

  it("does not grant founder on public submit functions", () => {
    const src = readFileSync(new URL("./wtae-data.ts", import.meta.url), "utf8");
    for (const name of ["submitEventRequest", "submitPhotographerApplication"]) {
      const start = src.indexOf(`export const ${name}`);
      const next = src.indexOf("export const ", start + 1);
      const block = src.slice(start, next === -1 ? undefined : next);
      assert.doesNotMatch(block, /requireFounder/);
      assert.doesNotMatch(block, /authMiddleware/);
    }
  });
});

describe("env config is server-only", () => {
  it("reads claim secret and emails from process env without exposing them", () => {
    const loaded = readFounderConfig({
      WTAE_FOUNDER_CLAIM_SECRET: secret,
      WTAE_FOUNDER_EMAILS: "one@x.com, two@x.com",
    });
    assert.equal(loaded.claimSecret, secret);
    assert.deepEqual(loaded.allowedEmails, ["one@x.com", "two@x.com"]);
  });
});
