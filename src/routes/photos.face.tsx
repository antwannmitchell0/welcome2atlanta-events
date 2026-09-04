"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Camera, RotateCcw, ScanFace, Shield, Upload } from "lucide-react";
import { FaceDemoSlot } from "@/components/face-demo";
import { ShareSheet } from "@/components/share-sheet";
import { parseCodeSearch, codeFromSearchString } from "@/lib/code-search";
import { events } from "@/lib/events";
import { resolvePublicCode } from "@/lib/portal/public-galleries";
import {
  captureFrame,
  descriptorFromImage,
  detectLiveFace,
  isFaceInGuide,
  loadFaceApi,
  matchFace,
  type FaceMatch,
} from "@/lib/face-engine";

export const Route = createFileRoute("/photos/face")({
  validateSearch: parseCodeSearch,
  loader: async ({ location }) => {
    const code = codeFromSearchString(location.searchStr);
    if (!code) return { resolved: null as Awaited<ReturnType<typeof resolvePublicCode>> };
    return { resolved: await resolvePublicCode({ data: { code } }) };
  },
  component: FaceSearch,
});

type Phase = "ready" | "camera" | "searching" | "results";

function FaceSearch() {
  const { code } = Route.useSearch();
  const { resolved } = Route.useLoaderData();
  const hit = resolved?.event;
  const scopedEvents = hit ? [hit, ...events.filter((event) => event.code !== hit.code)] : events;
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const lastDetectRef = useRef(0);
  const stableRef = useRef(0);

  const [phase, setPhase] = useState<Phase>("ready");
  const [hint, setHint] = useState("Scan your face to find every photo you appear in.");
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [matches, setMatches] = useState<FaceMatch[]>([]);
  const [scanned, setScanned] = useState(0);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadFaceApi().catch(() => {
      if (cancelled) return;
      setError("Scanner models failed to load. You can still upload a photo.");
    });
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [stopCamera]);

  const loop = useCallback(async () => {
    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!video || !overlay || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(() => void loop());
      return;
    }
    const now = performance.now();
    if (now - lastDetectRef.current < 140) {
      rafRef.current = requestAnimationFrame(() => void loop());
      return;
    }
    lastDetectRef.current = now;
    if (overlay.width !== video.videoWidth) {
      overlay.width = video.videoWidth;
      overlay.height = video.videoHeight;
    }
    const ctx = overlay.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, overlay.width, overlay.height);
    }
    try {
      const face = await detectLiveFace(video);
      if (face && ctx) {
        const { box } = face;
        ctx.strokeStyle = isFaceInGuide(box, video) ? "#cfc6b0" : "#9a9588";
        ctx.lineWidth = 4;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        if (isFaceInGuide(box, video)) {
          stableRef.current += 1;
          setLocked(stableRef.current > 4);
          setHint(stableRef.current > 4 ? "Face locked. Capture when you’re ready." : "Hold still…");
        } else {
          stableRef.current = 0;
          setLocked(false);
          setHint("Center your face in the oval");
        }
      } else {
        stableRef.current = 0;
        setLocked(false);
        setHint("Looking for a face");
      }
    } catch {
      setHint("Looking for a face");
    }
    rafRef.current = requestAnimationFrame(() => void loop());
  }, []);

  async function startCamera() {
    setError(null);
    setMatches([]);
    setPreview(null);
    setHint("Preparing camera…");
    try {
      await loadFaceApi();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setPhase("camera");
      setHint("Center your face in the oval");
      stableRef.current = 0;
      rafRef.current = requestAnimationFrame(() => void loop());
    } catch {
      setError("Camera access was blocked. Upload a selfie instead.");
    }
  }

  async function runSearch(source: HTMLImageElement | HTMLCanvasElement) {
    setPhase("searching");
    setHint("Matching your face across live galleries…");
    setScanned(scopedEvents.filter((event) => event.photoCount > 0).length);
    try {
      const descriptor = await descriptorFromImage(source);
      if (!descriptor) {
        setError("We couldn’t read a face in that photo. Try again with more light.");
        setPhase("ready");
        return;
      }
      const found = await matchFace(descriptor, scopedEvents);
      setMatches(found);
      setPhase("results");
      setHint(
        found.length
          ? `Found ${found.length} possible match${found.length === 1 ? "" : "es"}.`
          : "No confirmed matches yet.",
      );
    } catch {
      setError("Face search failed. Try another photo.");
      setPhase("ready");
    }
  }

  async function capture() {
    const video = videoRef.current;
    if (!video) return;
    cancelAnimationFrame(rafRef.current);
    const frame = captureFrame(video);
    const dataUrl = frame.toDataURL("image/jpeg", 0.9);
    setPreview(dataUrl);
    stopCamera();
    await runSearch(frame);
  }

  function onUpload(file: File) {
    const url = URL.createObjectURL(file);
    setPreview(url);
    const img = new Image();
    img.onload = () => {
      void runSearch(img);
    };
    img.src = url;
  }

  function reset() {
    stopCamera();
    setPhase("ready");
    setPreview(null);
    setMatches([]);
    setLocked(false);
    setError(null);
    setHint("Scan your face to find every photo you appear in.");
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-md items-center justify-between px-5">
          <Link to="/photos" search={code ? { code } : {}} className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg">
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <span className="text-sm text-accent">Face Scan</span>
          <span className="w-12" />
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 py-10">
        <div className="text-center">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-xl bg-surface">
            <ScanFace className="size-7 text-accent" />
          </div>
          <h1 className="font-display text-3xl text-fg">Scan your face</h1>
          <p className="mt-3 text-muted">{hint}</p>
          {resolved?.event ? (
            <p className="mt-2 text-xs tracking-[0.16em] text-accent">
              {resolved.event.code} · {resolved.event.neighborhood}
            </p>
          ) : null}
        </div>

        {phase === "camera" ? (
          <div className="relative mx-auto mt-8 aspect-square overflow-hidden rounded-xl border border-border bg-elevated">
            <video
              ref={videoRef}
              className="h-full w-full -scale-x-100 object-cover"
              playsInline
              muted
              autoPlay
            />
            <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100" />
            <div className="pointer-events-none absolute inset-[12%] rounded-full border-2 border-accent/80" />
          </div>
        ) : preview ? (
          <img
            src={preview}
            alt="Captured face"
            className="mx-auto mt-8 aspect-square w-full rounded-xl object-cover"
          />
        ) : (
          <div className="mx-auto mt-8 flex aspect-square items-center justify-center rounded-xl border border-dashed border-border bg-surface">
            <Camera className="size-10 text-accent" />
          </div>
        )}

        {error ? <p className="mt-4 text-center text-sm text-live">{error}</p> : null}

        {phase === "ready" ? (
          <>
            <FaceDemoSlot />
            <aside className="mt-6 rounded-xl border border-border bg-surface p-4 text-left">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-fg">Privacy disclaimer</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  Face scan runs on your device. We do not upload, store, sell, or train on your face. The camera
                  image is used only to search this session’s galleries, then discarded. Optional — you can find
                  photos by event, phone, or code instead.
                </p>
                <Link to="/privacy" className="mt-2 inline-block text-sm text-accent hover:text-fg">
                  Read full privacy policy
                </Link>
              </div>
            </div>
            </aside>
          </>
        ) : null}

        <div className="mt-6 space-y-3">
          {phase === "ready" ? (
            <>
              <button
                type="button"
                onClick={() => void startCamera()}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent font-semibold text-accent-fg"
              >
                <ScanFace className="size-4" />
                Open camera
              </button>
              <label className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-surface text-sm font-medium">
                <Upload className="size-4" />
                Upload a photo
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUpload(file);
                  }}
                />
              </label>
            </>
          ) : null}

          {phase === "camera" ? (
            <>
              <button
                type="button"
                disabled={!locked}
                onClick={() => void capture()}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent font-semibold text-accent-fg disabled:opacity-40"
              >
                Capture
              </button>
              <button type="button" onClick={reset} className="h-12 w-full text-sm text-subtle hover:text-muted">
                Cancel
              </button>
            </>
          ) : null}

          {phase === "searching" ? (
            <p className="text-center text-sm text-muted">Scanning {scanned} live galleries…</p>
          ) : null}

          {phase === "results" ? (
            <button
              type="button"
              onClick={reset}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-surface text-sm font-medium"
            >
              <RotateCcw className="size-4" />
              Scan again
            </button>
          ) : null}
        </div>

        {phase === "results" ? (
          <div className="mt-8 space-y-3">
            {matches.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface p-5 text-center">
                <p className="text-fg">No confirmed matches in the live galleries.</p>
                <p className="mt-2 text-sm text-muted">
                  If you were at the event, photos may still be uploading. Try another scan with more light.
                </p>
                <Link to="/explore" className="mt-4 inline-flex items-center gap-1 text-sm text-accent">
                  Browse events
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            ) : (
              <>
                {matches.map((match) => (
                  <Link
                    key={`${match.eventSlug}-${match.image}`}
                    to="/events/$slug"
                    params={{ slug: match.eventSlug }}
                    className="flex gap-3 overflow-hidden rounded-xl border border-border bg-surface hover:border-accent/40"
                  >
                    <img src={match.image} alt="" className="h-24 w-20 object-cover" />
                    <div className="flex flex-1 flex-col justify-center py-3 pr-4">
                      <p className="text-xs text-accent">{match.score}% match</p>
                      <p className="font-medium">{match.eventTitle}</p>
                      <p className="text-sm text-muted">Open gallery</p>
                    </div>
                  </Link>
                ))}
                <ShareSheet
                  neighborhood={resolved?.event.neighborhood ?? matches[0]?.eventTitle ?? "Atlanta"}
                  code={resolved?.event.code ?? code ?? "ATL"}
                  frames={matches.map((match, index) => ({
                    id: `${match.eventSlug}-${index}`,
                    src: match.image,
                  }))}
                />
              </>
            )}
          </div>
        ) : null}

        <p className="mt-8 text-center text-xs leading-relaxed text-subtle">
          By scanning or uploading, you agree this face check is optional, on-device, and not stored.{" "}
          <Link to="/privacy" className="text-accent hover:text-fg">
            Privacy policy
          </Link>
        </p>
      </main>
    </div>
  );
}
