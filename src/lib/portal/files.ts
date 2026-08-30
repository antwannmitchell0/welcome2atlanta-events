export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

export const HEIC_UNSUPPORTED_MESSAGE =
  "HEIC/HEIF is not supported in this release. Convert to JPEG or PNG on the device first.";

/** MIME types the owner may upload this release. HEIC is detected so we can reject it clearly. */
export const UPLOAD_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export type UploadExt = "jpg" | "png" | "webp";

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

export function extensionFromFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  return dot >= 0 ? base.slice(dot + 1).toLowerCase() : "";
}

export function claimedUploadExt(filename: string, declaredMime: string): { ok: true; ext: UploadExt; mime: string } | { ok: false; error: string } {
  if (isDangerousUpload(filename, declaredMime)) {
    return { ok: false, error: "That file type is not allowed." };
  }
  const ext = extensionFromFilename(filename);
  const mime = declaredMime.toLowerCase().split(";")[0]?.trim() ?? "";
  if (ext === "heic" || ext === "heif" || mime === "image/heic" || mime === "image/heif") {
    return { ok: false, error: HEIC_UNSUPPORTED_MESSAGE };
  }
  if (ext === "jpg" || ext === "jpeg" || mime === "image/jpeg") {
    if (ext && !["jpg", "jpeg"].includes(ext) && mime === "image/jpeg") {
      return { ok: false, error: "File extension does not match the image type." };
    }
    return { ok: true, ext: "jpg", mime: "image/jpeg" };
  }
  if (ext === "png" || mime === "image/png") {
    if (ext && ext !== "png" && mime === "image/png") {
      return { ok: false, error: "File extension does not match the image type." };
    }
    return { ok: true, ext: "png", mime: "image/png" };
  }
  if (ext === "webp" || mime === "image/webp") {
    if (ext && ext !== "webp" && mime === "image/webp") {
      return { ok: false, error: "File extension does not match the image type." };
    }
    return { ok: true, ext: "webp", mime: "image/webp" };
  }
  return { ok: false, error: "Only JPEG, PNG, and WebP images are accepted." };
}

export function acceptDetectedImage(detected: DetectedImage | null): { ok: true; ext: UploadExt; mime: string } | { ok: false; error: string } {
  if (!detected) return { ok: false, error: "The file is not a supported image." };
  if (detected.ext === "heic") return { ok: false, error: HEIC_UNSUPPORTED_MESSAGE };
  if (!UPLOAD_MIME.has(detected.mime)) return { ok: false, error: "Only JPEG, PNG, and WebP images are accepted." };
  return { ok: true, ext: detected.ext as UploadExt, mime: detected.mime };
}
