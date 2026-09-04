import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCoverageInput, reservedCodes } from "./coverage-store.ts";

describe("coverage requests", () => {
  it("accepts a full organizer booking", () => {
    const parsed = parseCoverageInput({
      name: "  Jordan Lee ",
      email: "Jordan@TheRoom.com",
      phone: "404-555-0199",
      date: "2026-10-12",
      neighborhood: "Midtown",
      sku: "ROOM",
      venue: "Peachtree Room",
      notes: "300 guests",
    });
    assert.equal(parsed.email, "jordan@theroom.com");
    assert.equal(parsed.sku, "room");
    assert.equal(parsed.neighborhood, "Midtown");
  });

  it("rejects unknown neighborhoods and skus", () => {
    assert.throws(
      () =>
        parseCoverageInput({
          name: "Jordan",
          email: "jordan@theroom.com",
          phone: "4045550199",
          date: "2026-10-12",
          neighborhood: "Brooklyn",
          sku: "room",
          venue: "Room",
          notes: "",
        }),
      /neighborhood/,
    );
    assert.throws(
      () =>
        parseCoverageInput({
          name: "Jordan",
          email: "jordan@theroom.com",
          phone: "4045550199",
          date: "2026-10-12",
          neighborhood: "Midtown",
          sku: "platinum",
          venue: "Room",
          notes: "",
        }),
      /ROOM/,
    );
  });

  it("reserves demo codes including ATL-404", () => {
    const reserved = reservedCodes();
    for (const code of ["ATL-404", "ATL-BELT", "ATL-O4W", "ATL-INVEST", "ATL-WTAE"]) {
      assert.equal(reserved.has(code), true);
    }
  });
});
