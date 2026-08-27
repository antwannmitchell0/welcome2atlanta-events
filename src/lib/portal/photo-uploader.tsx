"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { HEIC_UNSUPPORTED_MESSAGE, MAX_UPLOAD_BYTES } from "./files";

type ItemStatus =
  | "queued"
  | "hashing"
  | "uploading"
  | "processing"
  | "ready"
  | "failed"
  | "duplicate"
  | "cancelled";

type UploadItem = {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: ItemStatus;
  error: string | null;
  photoId: string | null;
  previewUrl: string;
};

type PrepareOk = {
  photoId: string;
  pathname: string;
  handleUploadUrl: string;
  access: "private";
  uploadMode: "client-token" | "presigned" | "unavailable";
};

const ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
const CONCURRENCY = 2;

function isHeic(file: File) {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return name.endsWith(".heic") || name.endsWith(".heif") || type.includes("heic") || type.includes("heif");
}

async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function postJson(body: unknown, signal?: AbortSignal) {
  const res = await fetch("/api/portal/upload", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
    photoId?: string;
    pathname?: string;
    handleUploadUrl?: string;
    access?: "private";
    uploadMode?: PrepareOk["uploadMode"];
    presignedUrl?: string;
    status?: string;
  };
  if (!res.ok) {
    const err = new Error(data.error || "Upload rejected.") as Error & { code?: string };
    err.code = data.code;
    throw err;
  }
  return data;
}

export function PhotoUploader({ eventId, onChanged }: { eventId: string; onChanged: () => void }) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortMap = useRef(new Map<string, AbortController>());
  const cancelled = useRef(new Set<string>());
  const liveRef = useRef<HTMLDivElement>(null);
  const waiting = useRef<string[]>([]);
  const running = useRef(0);
  const pumpRef = useRef<() => void>(() => {});
  const itemsRef = useRef<UploadItem[]>([]);

  useEffect(() => {
    return () => {
      items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const announce = useCallback((text: string) => {
    if (liveRef.current) liveRef.current.textContent = text;
  }, []);

  const patch = useCallback((id: string, next: Partial<UploadItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...next } : item)));
  }, []);

  const addFiles = useCallback(
    (list: FileList | File[]) => {
      const next: UploadItem[] = [];
      for (const file of Array.from(list)) {
        next.push({
          id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          name: file.name,
          size: file.size,
          progress: 0,
          status: "queued",
          error: null,
          photoId: null,
          previewUrl: URL.createObjectURL(file),
        });
      }
      if (next.length === 0) return;
      setItems((prev) => [...prev, ...next]);
      announce(`${next.length} file${next.length === 1 ? "" : "s"} added.`);
      waiting.current.push(...next.map((item) => item.id));
      queueMicrotask(() => pumpRef.current());
    },
    [announce],
  );

  const runOne = useCallback(
    async (id: string) => {
      const current = () => itemsRef.current.find((item) => item.id === id);
      const item = current();
      if (!item || item.status === "ready" || item.status === "cancelled" || item.status === "duplicate") return;
      if (cancelled.current.has(id)) {
        patch(id, { status: "cancelled", error: "Cancelled." });
        return;
      }
      if (isHeic(item.file)) {
        patch(id, { status: "failed", error: HEIC_UNSUPPORTED_MESSAGE });
        return;
      }
      if (item.size > MAX_UPLOAD_BYTES) {
        patch(id, { status: "failed", error: "File is too large. Max 12MB." });
        return;
      }

      const controller = new AbortController();
      abortMap.current.set(id, controller);
      try {
        patch(id, { status: "hashing", error: null, progress: 2 });
        const checksum = await sha256Hex(item.file);
        if (cancelled.current.has(id)) throw new DOMException("Aborted", "AbortError");
        patch(id, { status: "uploading", progress: 8 });
        const prepared = await postJson(
          {
            intent: "prepare",
            eventId,
            filename: item.file.name,
            size: item.file.size,
            mime: item.file.type || "application/octet-stream",
            checksum,
          },
          controller.signal,
        );
        patch(id, { photoId: prepared.photoId ?? null, progress: 16 });
        const pathname = prepared.pathname;
        if (!pathname || !prepared.photoId) throw new Error("Upload grant is invalid.");

        if (prepared.uploadMode === "client-token") {
          await upload(pathname, item.file, {
            access: "private",
            handleUploadUrl: prepared.handleUploadUrl || "/api/portal/upload",
            clientPayload: JSON.stringify({ photoId: prepared.photoId }),
            abortSignal: controller.signal,
            multipart: item.file.size > 5 * 1024 * 1024,
            onUploadProgress: ({ percentage }) => {
              patch(id, { progress: Math.max(16, Math.min(90, Math.round(percentage * 0.74) + 16)) });
            },
          });
        } else {
          const signed = await postJson({ intent: "presign", photoId: prepared.photoId }, controller.signal);
          if (!signed.presignedUrl) throw new Error("Could not start the private upload.");
          const put = await fetch(signed.presignedUrl, {
            method: "PUT",
            body: item.file,
            headers: { "Content-Type": item.file.type || "application/octet-stream" },
            signal: controller.signal,
          });
          if (!put.ok) throw new Error("Private upload failed.");
          patch(id, { progress: 90 });
        }

        patch(id, { status: "processing", progress: 94 });
        await postJson({ intent: "complete", photoId: prepared.photoId }, controller.signal);
        patch(id, { status: "ready", progress: 100, error: null });
        announce(`${item.name} ready.`);
        onChanged();
      } catch (err) {
        if (cancelled.current.has(id) || (err instanceof DOMException && err.name === "AbortError")) {
          patch(id, { status: "cancelled", error: "Cancelled.", progress: 0 });
          return;
        }
        const message = err instanceof Error ? err.message : "Upload failed.";
        const code = (err as { code?: string }).code;
        if (code === "duplicate") {
          patch(id, { status: "duplicate", error: message, progress: 0 });
          announce(`${item.name} is already in this event.`);
          return;
        }
        patch(id, { status: "failed", error: message, progress: 0 });
        announce(`${item.name} failed.`);
      } finally {
        abortMap.current.delete(id);
      }
    },
    [announce, eventId, onChanged, patch],
  );

  itemsRef.current = items;

  const pump = useCallback(() => {
    while (running.current < CONCURRENCY && waiting.current.length > 0) {
      const id = waiting.current.shift();
      if (!id) break;
      running.current += 1;
      void runOne(id).finally(() => {
        running.current -= 1;
        pump();
      });
    }
  }, [runOne]);
  pumpRef.current = pump;

  const runQueue = useCallback(
    (ids: string[]) => {
      waiting.current.push(...ids);
      pump();
    },
    [pump],
  );

  function cancel(id: string) {
    cancelled.current.add(id);
    abortMap.current.get(id)?.abort();
    patch(id, { status: "cancelled", error: "Cancelled." });
  }

  function retryFailed() {
    cancelled.current.clear();
    const ids = itemsRef.current.filter((item) => item.status === "failed").map((item) => item.id);
    ids.forEach((id) => patch(id, { status: "queued", error: null, progress: 0 }));
    runQueue(ids);
  }

  const counts = useMemo(() => {
    const ready = items.filter((item) => item.status === "ready").length;
    const failed = items.filter((item) => item.status === "failed").length;
    const duplicate = items.filter((item) => item.status === "duplicate").length;
    const active = items.filter((item) =>
      ["queued", "hashing", "uploading", "processing"].includes(item.status),
    ).length;
    const overall =
      items.length === 0 ? 0 : Math.round(items.reduce((sum, item) => sum + item.progress, 0) / items.length);
    return { ready, failed, duplicate, active, overall, total: items.length };
  }, [items]);

  return (
    <section className="space-y-4">
      <div ref={liveRef} className="sr-only" aria-live="polite" />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        className={`rounded-xl border border-dashed px-4 py-10 text-center ${
          dragOver ? "border-accent bg-elevated" : "border-border bg-surface"
        }`}
      >
        <p className="font-medium">Drop JPEG, PNG, or WebP photos here</p>
        <p className="mt-2 text-sm text-muted">
          iPhone photo library works. HEIC is not supported this release — convert first. Max 12MB each.
        </p>
        <button
          type="button"
          className="mt-5 inline-flex min-h-11 items-center rounded-full bg-accent px-5 font-semibold text-accent-fg"
          onClick={() => inputRef.current?.click()}
        >
          Choose photos
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {counts.total > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-muted">
              {counts.ready} ready · {counts.failed} failed
              {counts.duplicate ? ` · ${counts.duplicate} duplicate` : ""} · {counts.active} in flight
            </p>
            {counts.failed > 0 ? (
              <button
                type="button"
                className="min-h-11 rounded-full border border-border px-4"
                onClick={retryFailed}
              >
                Retry failed
              </button>
            ) : null}
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-elevated"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={counts.overall}
            aria-label="Batch upload progress"
          >
            <div className="h-full bg-accent transition-[width]" style={{ width: `${counts.overall}%` }} />
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <li key={item.id} className="overflow-hidden rounded-xl border border-border bg-surface">
                <div className="relative aspect-square bg-elevated">
                  <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                  {item.status === "uploading" || item.status === "processing" || item.status === "hashing" ? (
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-bg/60">
                      <div className="h-full bg-accent" style={{ width: `${item.progress}%` }} />
                    </div>
                  ) : null}
                </div>
                <div className="space-y-2 p-3">
                  <p className="truncate text-xs" title={item.name}>
                    {item.name}
                  </p>
                  <p className="text-xs text-muted">
                    {item.status === "ready"
                      ? "Ready"
                      : item.status === "duplicate"
                        ? "Already in this event"
                        : item.status === "processing"
                          ? "Processing"
                          : item.status === "hashing"
                            ? "Checking"
                            : item.status === "uploading"
                              ? `${item.progress}%`
                              : item.status === "cancelled"
                                ? "Cancelled"
                                : item.status === "failed"
                                  ? "Failed"
                                  : "Queued"}
                  </p>
                  {item.error ? <p className="text-xs text-live">{item.error}</p> : null}
                  {["queued", "hashing", "uploading", "processing"].includes(item.status) ? (
                    <button
                      type="button"
                      className="min-h-11 w-full rounded-full border border-border text-xs"
                      onClick={() => cancel(item.id)}
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
