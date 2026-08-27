export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
export const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export type DetectedImage = {
  mime: "image/jpeg" | "image/png" | "image/webp" | "image/heic" | "image/heif";
  ext: "jpg" | "png" | "webp" | "heic";
};

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

export function detectImageSignature(bytes: Uint8Array): DetectedImage | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { mime: "image/png", ext: "png" };
  }
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
    return { mime: "image/webp", ext: "webp" };
  }
  if (ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4).toLowerCase();
    if (["heic", "heix", "hevc", "hevx"].includes(brand)) return { mime: "image/heic", ext: "heic" };
    if (["heif", "mif1", "msf1"].includes(brand)) return { mime: "image/heif", ext: "heic" };
  }
  return null;
}

export function isDangerousUpload(filename: string, mime: string): boolean {
  const lower = filename.toLowerCase();
  if (/\.(svg|html?|js|mjs|cjs|exe|sh|php|wasm)$/i.test(lower)) return true;
  if (mime.includes("svg") || mime.includes("javascript") || mime.includes("html")) return true;
  return false;
}
