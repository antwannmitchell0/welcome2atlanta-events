import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateEventCode,
  isValidEventCode,
  normalizeEventCode,
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

  it("slugifies names", () => {
    assert.equal(slugify("Portal Upload Test"), "portal-upload-test");
  });

  it("sanitizes display filenames", () => {
    assert.equal(safeDisplayFilename("../../secret.jpg"), "secret.jpg");
  });
});
