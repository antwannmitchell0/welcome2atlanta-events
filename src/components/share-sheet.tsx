"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download, Share2 } from "lucide-react";
import { neighborhoodCaption } from "@/lib/site";
import { neighborhoodWatermark } from "@/lib/watermark";

export type ShareFrame = {
  id: string;
  src: string;
};

export function ShareSheet({
  neighborhood,
  code,
  frames,
}: {
  neighborhood: string;
  code: string;
  frames: ShareFrame[];
}) {
  const [picked, setPicked] = useState<string[]>(() => frames.slice(0, 3).map((frame) => frame.id));
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const caption = useMemo(() => neighborhoodCaption(neighborhood, code), [neighborhood, code]);
  const selected = frames.filter((frame) => picked.includes(frame.id)).slice(0, 3);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  function toggle(id: string) {
    setPicked((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setStatus("Could not copy. Select the caption and copy it yourself.");
    }
  }

  async function downloadSelected() {
    if (selected.length === 0) {
      setStatus("Pick up to 3 frames.");
      return;
    }
    setStatus("Preparing downloads…");
    for (const frame of selected) {
      await downloadWatermarked(frame.src, neighborhood, `${code}-${frame.id}.jpg`);
    }
    setStatus(`Downloaded ${selected.length} frame${selected.length === 1 ? "" : "s"}.`);
  }

  async function share() {
    if (!canShare) {
      await copyCaption();
      return;
    }
    try {
      await navigator.share({ title: "Welcome to Atlanta Events", text: caption });
    } catch {
      // user cancelled
    }
  }

  if (frames.length === 0) return null;

  return (
    <section className="mt-8 rounded-xl border border-border bg-surface p-5">
      <p className="text-xs tracking-[0.2em] text-accent">SHARE THE ROOM</p>
      <h2 className="mt-2 font-display text-2xl">Take up to 3 frames with you</h2>
      <p className="mt-2 text-sm text-muted">
        Download, copy a caption, or share. Guest photos stay free.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {frames.slice(0, 9).map((frame) => {
          const on = picked.includes(frame.id);
          return (
            <button
              key={frame.id}
              type="button"
              onClick={() => toggle(frame.id)}
              className={
                on
                  ? "overflow-hidden rounded-lg ring-2 ring-accent"
                  : "overflow-hidden rounded-lg ring-1 ring-border"
              }
            >
              <img src={frame.src} alt="" className="aspect-[4/5] w-full object-cover" />
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-subtle">{selected.length} / 3 selected</p>
      <textarea
        readOnly
        value={caption}
        className="mt-4 h-24 w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg"
      />
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => void downloadSelected()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-accent-fg"
        >
          <Download className="size-4" />
          Download
        </button>
        <button
          type="button"
          onClick={() => void copyCaption()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-bg text-sm font-medium"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy caption"}
        </button>
        <button
          type="button"
          onClick={() => void share()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-bg text-sm font-medium"
        >
          <Share2 className="size-4" />
          {canShare ? "Share" : "Copy to share"}
        </button>
      </div>
      {status ? <p className="mt-3 text-sm text-muted">{status}</p> : null}
    </section>
  );
}

async function downloadWatermarked(src: string, neighborhood: string, filename: string) {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw frame");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const mark = neighborhoodWatermark(neighborhood);
  const size = Math.max(14, Math.round(canvas.width * 0.028));
  ctx.font = `600 ${size}px "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = "rgba(243,239,230,0.92)";
  ctx.shadowColor = "rgba(0,0,0,0.65)";
  ctx.shadowBlur = 6;
  ctx.fillText(mark, size, canvas.height - size);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load frame"));
    img.src = src;
  });
}
