"use client";

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, QrCode } from "lucide-react";
import { PhotosHeader } from "@/components/photos-header";
import { getEventByCode } from "@/lib/events";

export const Route = createFileRoute("/photos/qr")({ component: QrSearch });

function QrSearch() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const matched = getEventByCode(code);

  return (
    <div className="min-h-screen bg-bg text-fg">
      <PhotosHeader title="Event code" />
      <main className="mx-auto max-w-md px-5 py-16">
        <div className="text-center">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-md bg-surface">
            <QrCode className="size-7 text-gold" />
          </div>
          <h1 className="font-hero text-4xl text-fg">ENTER EVENT CODE</h1>
          <p className="mt-3 text-muted">From the QR in the room, the wristband, or your confirmation.</p>
        </div>
        <label htmlFor="qr-code" className="sr-only">
          Event code
        </label>
        <input
          id="qr-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          placeholder="ATL-404"
          className="mt-8 h-12 w-full rounded-md border border-border bg-elevated px-4 text-center text-lg tracking-widest text-fg placeholder:text-subtle outline-none focus:border-gold"
        />
        {matched && matched.photoCount > 0 ? (
          <Link
            to="/events/$slug"
            params={{ slug: matched.slug }}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold font-semibold text-gold-fg"
          >
            Open {matched.title}
            <ArrowRight className="size-4" />
          </Link>
        ) : (
          <button
            type="button"
            disabled={code.trim().length < 3}
            onClick={() => {
              const event = getEventByCode(code);
              if (!event) setError("No event matches that code.");
              else if (event.photoCount === 0) setError("That gallery isn’t live yet.");
            }}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold font-semibold text-gold-fg disabled:opacity-40"
          >
            Open gallery
          </button>
        )}
        {error ? <p className="mt-4 text-center text-sm text-live">{error}</p> : null}
        <p className="mt-6 text-center text-xs text-subtle">Try ATL-404 · ATL-BELT · ATL-O4W · ATL-INVEST · ATL-WTAE</p>
      </main>
    </div>
  );
}
