import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateEventCode,
  generateGuestCode,
  isGuestEventCode,
  isValidEventCode,
  normalizeEventCode,
  RESERVED_DEMO_CODES,
  safeDisplayFilename,
  slugify,
} from "./codes.ts";

describe("event codes", () => {
  it("normalizes case and spaces", () => {
    assert.equal(normalizeEventCode("  atl-404  "), "ATL-404");
  });

  it("rejects unsafe characters", () => {
    assert.equal(isValidEventCode("ATL-404"), true);
    assert.equal(isValidEventCode("../etc"), false);
    assert.equal(isValidEventCode("ATL 404"), true);
    assert.equal(isValidEventCode("x"), false);
    assert.equal(isValidEventCode("ATL-OK!"), false);
  });

  it("generates unique-looking uppercase codes", () => {
    const a = generateEventCode("Portal Upload Test");
    const b = generateEventCode("Portal Upload Test");
    assert.match(a, /^ATL-/);
    assert.notEqual(a, b);
    assert.equal(isValidEventCode(a), true);
  });

  it("mints ATL-XXXX guest codes that miss reserved demo suffixes", () => {
    const seq = [0.1, 0.2, 0.3, 0.4];
    let i = 0;
    const code = generateGuestCode(4, () => seq[i++ % seq.length]!);
    assert.match(code, /^ATL-[A-Z0-9]{4}$/);
    assert.equal(isGuestEventCode(code), true);
    assert.equal(isValidEventCode(code), true);
    for (const reserved of RESERVED_DEMO_CODES) {
      assert.notEqual(code, reserved);
    }
    assert.equal(isGuestEventCode("ATL-404"), false);
    assert.equal(isGuestEventCode("ATL-BELT"), true);
    assert.equal(isGuestEventCode("ATL-INVEST"), true);
    assert.equal(isGuestEventCode("ATL-WTAE"), true);
  });

  it("slugifies names", () => {
    assert.equal(slugify("Portal Upload Test"), "portal-upload-test");
  });

  it("sanitizes display filenames", () => {
    assert.equal(safeDisplayFilename("../../secret.jpg"), "secret.jpg");
  });
});
