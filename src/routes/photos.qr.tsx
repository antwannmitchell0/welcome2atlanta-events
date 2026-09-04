"use client";

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, QrCode } from "lucide-react";
import { parseCodeSearch, codeFromSearchString } from "@/lib/code-search";
import { getEventByCode } from "@/lib/events";
import { resolvePublicCode } from "@/lib/portal/public-galleries";

export const Route = createFileRoute("/photos/qr")({
  validateSearch: parseCodeSearch,
  loader: async ({ location }) => {
    const code = codeFromSearchString(location.searchStr);
    if (!code) return { resolved: null as Awaited<ReturnType<typeof resolvePublicCode>> };
    return { resolved: await resolvePublicCode({ data: { code } }) };
  },
  component: QrSearch,
});

function QrSearch() {
  const { code: incoming } = Route.useSearch();
  const { resolved } = Route.useLoaderData();
  const [code, setCode] = useState(incoming?.toUpperCase() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [matched, setMatched] = useState(resolved?.event ?? null);
  const sample = getEventByCode(code);
  const event = sample ?? matched;

  async function open() {
    const found = getEventByCode(code);
    if (found) {
      setMatched(found);
      if (found.photoCount === 0) setError("That gallery isn’t live yet.");
      return;
    }
    const hit = await resolvePublicCode({ data: { code } });
    if (!hit) {
      setError("No event matches that code.");
      setMatched(null);
      return;
    }
    setMatched(hit.event);
    if (hit.event.photoCount === 0) setError("That gallery isn’t live yet.");
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-md items-center justify-between px-5">
          <Link to="/photos" search={incoming ? { code: incoming } : {}} className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg">
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <span className="text-sm text-accent">Event Code</span>
          <span className="w-12" />
        </div>
      </header>
      <main className="mx-auto max-w-md px-5 py-16">
        <div className="text-center">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-xl bg-surface">
            <QrCode className="size-7 text-accent" />
          </div>
          <h1 className="font-display text-3xl text-fg">Enter event code</h1>
          <p className="mt-3 text-muted">From the QR in the room, the wristband, or your confirmation.</p>
        </div>
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
            setMatched(null);
          }}
          placeholder="ATL-404"
          className="mt-8 h-12 w-full rounded-xl border border-border bg-surface px-4 text-center text-lg tracking-widest text-fg placeholder:text-subtle outline-none focus:border-accent"
        />
        {event && event.photoCount > 0 && !event.slug.startsWith("code-") ? (
          <Link
            to="/events/$slug"
            params={{ slug: event.slug }}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent font-semibold text-accent-fg"
          >
            Open {event.title}
            <ArrowRight className="size-4" />
          </Link>
        ) : (
          <button
            type="button"
            disabled={code.trim().length < 3}
            onClick={() => void open()}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent font-semibold text-accent-fg disabled:opacity-40"
          >
            Open gallery
          </button>
        )}
        {event ? <p className="mt-4 text-center text-sm text-accent">{event.title} · {event.code}</p> : null}
        {error ? <p className="mt-4 text-center text-sm text-live">{error}</p> : null}
        <p className="mt-6 text-center text-xs text-subtle">Try ATL-404 · ATL-BELT · ATL-O4W · ATL-INVEST · ATL-WTAE</p>
      </main>
    </div>
  );
}
