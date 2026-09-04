import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { neighborhoodCaption, photosPathForCode, photosUrlForCode, socialLinks } from "./site.ts";
import { neighborhoodWatermark } from "./watermark.ts";

describe("public site config", () => {
  it("builds gallery urls and captions from one origin", () => {
    assert.equal(photosPathForCode("atl-k3m2"), "/photos?code=ATL-K3M2");
    assert.equal(
      photosUrlForCode("ATL-K3M2"),
      "https://www.welcome2atlantaevents.com/photos?code=ATL-K3M2",
    );
    assert.match(neighborhoodCaption("Midtown", "ATL-K3M2"), /Caught in Midtown/);
    assert.equal(neighborhoodWatermark("The BeltLine"), "The BeltLine · WTAE");
    assert.deepEqual(
      socialLinks.map((link) => link.id),
      ["instagram", "tiktok", "x"],
    );
  });
});
