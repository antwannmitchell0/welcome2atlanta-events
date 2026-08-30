import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safePortalNext } from "./redirect.ts";

describe("safePortalNext", () => {
  it("allows in-app portal paths", () => {
    assert.equal(safePortalNext("/portal"), "/portal");
    assert.equal(safePortalNext("/portal/events/new"), "/portal/events/new");
  });

  it("rejects open redirects", () => {
    assert.equal(safePortalNext("https://evil.example"), "/portal");
    assert.equal(safePortalNext("//evil.example"), "/portal");
    assert.equal(safePortalNext("/\\evil.example"), "/portal");
    assert.equal(safePortalNext("/portal/login"), "/portal");
    assert.equal(safePortalNext("https://welcome2atlantaevents.com"), "/portal");
  });
});
