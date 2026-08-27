import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPublicDerivative, jpegHasExif, stripJpegMetadata } from "./image-process.ts";

function u16(n: number): number[] {
  return [(n >> 8) & 0xff, n & 0xff];
}

/** Minimal 3×2 JPEG with an APP1 Exif segment and a SOF0. */
function jpegWithExif(): Uint8Array {
  const exif = [
    0xff, 0xd8,
    0xff, 0xe1, ...u16(16),
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0xff, 0xc0, ...u16(11), 0x08, ...u16(2), ...u16(3), 0x01, 0x01, 0x11, 0x00,
    0xff, 0xda, ...u16(8), 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
    0x00, 0x00, 0xff, 0xd9,
  ];
  return Uint8Array.from(exif);
}

describe("public derivatives", () => {
  it("strips JPEG EXIF and reports dimensions", () => {
    const original = jpegWithExif();
    assert.equal(jpegHasExif(original), true);
    const derivative = buildPublicDerivative(original);
    assert.equal(derivative.mime, "image/jpeg");
    assert.equal(derivative.stripped, true);
    assert.equal(derivative.width, 3);
    assert.equal(derivative.height, 2);
    assert.equal(jpegHasExif(derivative.bytes), false);
    assert.equal(stripJpegMetadata(original).stripped, true);
  });

  it("keeps a JPEG without EXIF", () => {
    const bytes = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
    const derivative = buildPublicDerivative(bytes);
    assert.equal(derivative.mime, "image/jpeg");
    assert.equal(jpegHasExif(derivative.bytes), false);
  });
});
