import { Buffer } from "node:buffer";
import { get, del, put } from "@vercel/blob";
import { MAX_UPLOAD_BYTES } from "./files.ts";

export async function streamToBytes(stream: ReadableStream<Uint8Array>, max = MAX_UPLOAD_BYTES): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) throw new Error("File is too large.");
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

export async function readPrivateBlob(pathname: string): Promise<Uint8Array | null> {
  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return streamToBytes(result.stream);
}

export async function deletePrivateBlob(pathname: string): Promise<void> {
  await del(pathname);
}

export async function putPrivateBlob(pathname: string, bytes: Uint8Array, contentType: string) {
  return put(pathname, Buffer.from(bytes), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
  });
}
