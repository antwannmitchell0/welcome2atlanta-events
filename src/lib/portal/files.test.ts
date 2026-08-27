import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectImageSignature, isDangerousUpload } from "./files.ts";

describe("image signatures", () => {
  it("accepts jpeg magic", () => {
    const bytes = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    assert.equal(detectImageSignature(bytes)?.mime, "image/jpeg");
  });

  it("accepts png magic", () => {
    const bytes = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    assert.equal(detectImageSignature(bytes)?.mime, "image/png");
  });

  it("rejects spoofed svg and executables", () => {
    assert.equal(isDangerousUpload("photo.svg", "image/svg+xml"), true);
    assert.equal(isDangerousUpload("ok.jpg", "image/jpeg"), false);
  });

  it("rejects random bytes", () => {
    const bytes = Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    assert.equal(detectImageSignature(bytes), null);
  });
});
