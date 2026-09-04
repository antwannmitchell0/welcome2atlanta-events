import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GUEST_PHOTOS_LINE, getSku, organizerSkus } from "./skus.ts";

describe("organizer skus", () => {
  it("ships ROOM NIGHT BLOCK with the locked prices", () => {
    assert.deepEqual(
      organizerSkus.map((sku) => `${sku.name} ${sku.priceLabel}`),
      ["ROOM $450", "NIGHT $900", "BLOCK $2400 / 4 dates"],
    );
    assert.equal(getSku("room")?.summary.includes("1 photographer"), true);
    assert.equal(GUEST_PHOTOS_LINE, "Guest photos stay free.");
  });
});
