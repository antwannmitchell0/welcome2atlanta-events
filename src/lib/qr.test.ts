import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { encodeQrMatrix, qrSvg } from "./qr.ts";

describe("print QR", () => {
  it("encodes a gallery url into a square matrix with finder corners", () => {
    const url = "https://www.welcome2atlantaevents.com/photos?code=ATL-K3M2";
    const matrix = encodeQrMatrix(url);
    assert.equal(matrix.length, matrix[0]?.length);
    assert.equal(matrix.length % 4, 1);
    assert.equal(matrix[0]![0], true);
    assert.equal(matrix[0]![6], true);
    assert.equal(matrix[6]![0], true);
    assert.equal(matrix[6]![6], true);
    const svg = qrSvg(url);
    assert.match(svg, /<svg /);
    assert.match(svg, /#cfc6b0/);
  });
});
