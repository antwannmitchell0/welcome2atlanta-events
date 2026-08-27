import { acceptDetectedImage, detectImageSignature, type DetectedImage } from "./files.ts";

export type PublicDerivative = {
  bytes: Uint8Array;
  mime: "image/jpeg" | "image/png" | "image/webp";
  width: number | null;
  height: number | null;
  stripped: boolean;
};

const JPEG_DROP = new Set([0xe1, 0xe2, 0xed, 0xfe]);
const PNG_DROP = new Set(["eXIf", "tEXt", "iTXt", "zTXt", "tIME"]);
const WEBP_DROP = new Set(["EXIF", "XMP ", "ICCP"]);

function u16be(bytes: Uint8Array, offset: number): number {
  return (bytes[offset]! << 8) | bytes[offset + 1]!;
}

function u32be(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset]! * 0x1000000 +
      ((bytes[offset + 1]! << 16) | (bytes[offset + 2]! << 8) | bytes[offset + 3]!)) >>>
    0
  );
}

function u32le(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset]! |
      (bytes[offset + 1]! << 8) |
      (bytes[offset + 2]! << 16) |
      (bytes[offset + 3]! << 24)) >>>
    0
  );
}

function u16le(bytes: Uint8Array, offset: number): number {
  return bytes[offset]! | (bytes[offset + 1]! << 8);
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.byteLength;
  }
  return out;
}

export function jpegHasExif(bytes: Uint8Array): boolean {
  if (bytes.length < 12 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return false;
  let i = 2;
  while (i + 4 < bytes.length && bytes[i] === 0xff) {
    while (i < bytes.length && bytes[i] === 0xff) i += 1;
    if (i >= bytes.length) break;
    const marker = bytes[i]!;
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0xe1) {
      const payload = bytes.slice(i + 3, i + 11);
      return ascii(payload, 0, 4) === "Exif";
    }
    if (marker >= 0xd0 && marker <= 0xd7) {
      i += 1;
      continue;
    }
    const size = u16be(bytes, i + 1);
    i += 1 + size;
  }
  return false;
}

export function readImageSize(bytes: Uint8Array, kind?: DetectedImage["ext"]): { width: number; height: number } | null {
  const detected = kind ?? detectImageSignature(bytes)?.ext;
  if (detected === "jpg") return readJpegSize(bytes);
  if (detected === "png") return readPngSize(bytes);
  if (detected === "webp") return readWebpSize(bytes);
  return null;
}

function readJpegSize(bytes: Uint8Array): { width: number; height: number } | null {
  let i = 2;
  while (i + 8 < bytes.length && bytes[i] === 0xff) {
    while (i < bytes.length && bytes[i] === 0xff) i += 1;
    if (i >= bytes.length) break;
    const marker = bytes[i]!;
    if (marker === 0xda || marker === 0xd9) break;
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { height: u16be(bytes, i + 4), width: u16be(bytes, i + 6) };
    }
    if (marker >= 0xd0 && marker <= 0xd7) {
      i += 1;
      continue;
    }
    const size = u16be(bytes, i + 1);
    if (size < 2) break;
    i += 1 + size;
  }
  return null;
}

function readPngSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24) return null;
  if (ascii(bytes, 12, 4) !== "IHDR") return null;
  return { width: u32be(bytes, 16), height: u32be(bytes, 20) };
}

function readWebpSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 30 || ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 4) !== "WEBP") return null;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const type = ascii(bytes, offset, 4);
    const size = u32le(bytes, offset + 4);
    const data = offset + 8;
    if (type === "VP8X" && data + 10 <= bytes.length) {
      const width = 1 + (bytes[data + 4]! | (bytes[data + 5]! << 8) | (bytes[data + 6]! << 16));
      const height = 1 + (bytes[data + 7]! | (bytes[data + 8]! << 8) | (bytes[data + 9]! << 16));
      return { width, height };
    }
    if (type === "VP8 " && data + 10 <= bytes.length) {
      return {
        width: u16le(bytes, data + 6) & 0x3fff,
        height: u16le(bytes, data + 8) & 0x3fff,
      };
    }
    if (type === "VP8L" && data + 5 <= bytes.length) {
      const bits = u32le(bytes, data + 1);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    offset += 8 + size + (size % 2);
  }
  return null;
}

export function stripJpegMetadata(bytes: Uint8Array): { bytes: Uint8Array; stripped: boolean } {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return { bytes, stripped: false };
  }
  const parts: Uint8Array[] = [Uint8Array.of(0xff, 0xd8)];
  let i = 2;
  let stripped = false;
  while (i < bytes.length) {
    if (bytes[i] !== 0xff) {
      parts.push(bytes.slice(i));
      break;
    }
    while (i < bytes.length && bytes[i] === 0xff) i += 1;
    if (i >= bytes.length) break;
    const marker = bytes[i]!;
    if (marker === 0xd9) {
      parts.push(Uint8Array.of(0xff, 0xd9));
      break;
    }
    if (marker === 0xda) {
      parts.push(Uint8Array.of(0xff, 0xda), bytes.slice(i + 1));
      break;
    }
    if (marker >= 0xd0 && marker <= 0xd7) {
      parts.push(Uint8Array.of(0xff, marker));
      i += 1;
      continue;
    }
    if (i + 2 >= bytes.length) break;
    const size = u16be(bytes, i + 1);
    const end = i + 1 + size;
    if (JPEG_DROP.has(marker)) stripped = true;
    else parts.push(Uint8Array.of(0xff, marker), bytes.slice(i + 1, end));
    i = end;
  }
  return { bytes: concat(parts), stripped };
}

export function stripPngMetadata(bytes: Uint8Array): { bytes: Uint8Array; stripped: boolean } {
  if (bytes.length < 8 || bytes[0] !== 0x89) return { bytes, stripped: false };
  const parts: Uint8Array[] = [bytes.slice(0, 8)];
  let offset = 8;
  let stripped = false;
  while (offset + 12 <= bytes.length) {
    const size = u32be(bytes, offset);
    const type = ascii(bytes, offset + 4, 4);
    const end = offset + 12 + size;
    if (PNG_DROP.has(type)) stripped = true;
    else parts.push(bytes.slice(offset, end));
    offset = end;
    if (type === "IEND") break;
  }
  return { bytes: concat(parts), stripped };
}

export function stripWebpMetadata(bytes: Uint8Array): { bytes: Uint8Array; stripped: boolean } {
  if (bytes.length < 12 || ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 4) !== "WEBP") {
    return { bytes, stripped: false };
  }
  const chunks: Uint8Array[] = [];
  let offset = 12;
  let stripped = false;
  while (offset + 8 <= bytes.length) {
    const size = u32le(bytes, offset + 4);
    const padded = size + (size % 2);
    const end = offset + 8 + padded;
    const type = ascii(bytes, offset, 4);
    if (WEBP_DROP.has(type)) stripped = true;
    else chunks.push(bytes.slice(offset, Math.min(end, bytes.length)));
    offset = end;
  }
  const body = concat(chunks);
  const out = new Uint8Array(12 + body.byteLength);
  out.set(bytes.slice(0, 12), 0);
  const total = body.byteLength + 4;
  out[4] = total & 0xff;
  out[5] = (total >> 8) & 0xff;
  out[6] = (total >> 16) & 0xff;
  out[7] = (total >> 24) & 0xff;
  out.set(body, 12);
  return { bytes: out, stripped };
}

export function buildPublicDerivative(bytes: Uint8Array): PublicDerivative {
  const detected = acceptDetectedImage(detectImageSignature(bytes));
  if (!detected.ok) throw new Error(detected.error);
  const size = readImageSize(bytes, detected.ext);
  if (detected.ext === "jpg") {
    const next = stripJpegMetadata(bytes);
    return { bytes: next.bytes, mime: "image/jpeg", width: size?.width ?? null, height: size?.height ?? null, stripped: next.stripped };
  }
  if (detected.ext === "png") {
    const next = stripPngMetadata(bytes);
    return { bytes: next.bytes, mime: "image/png", width: size?.width ?? null, height: size?.height ?? null, stripped: next.stripped };
  }
  const next = stripWebpMetadata(bytes);
  return { bytes: next.bytes, mime: "image/webp", width: size?.width ?? null, height: size?.height ?? null, stripped: next.stripped };
}
