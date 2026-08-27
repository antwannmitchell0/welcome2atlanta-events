"use client";

import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { events, getEventByCode, type EventRecord } from "@/lib/events";
import { listPublicGalleries, lookupPublicGalleryByCode } from "@/lib/portal/public-galleries";

export const Route = createFileRoute("/photos/event")({
  loader: () => listPublicGalleries(),
  component: SearchByEvent,
});

function SearchByEvent() {
  const { published } = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [matched, setMatched] = useState<EventRecord | null>(null);
  const [looking, setLooking] = useState(false);

  const catalog = useMemo(() => [...events, ...published], [published]);
  const sampleMatch = getEventByCode(code);

  const filtered = catalog.filter((event) => {
    const hay = `${event.title} ${event.venue} ${event.neighborhood} ${event.code}`.toLowerCase();
    return hay.includes(query.toLowerCase());
  });

  const openTarget = sampleMatch ?? matched;

  async function openCode() {
    setCodeError(null);
    const sample = getEventByCode(code);
    if (sample) {
      if (sample.photoCount === 0) setCodeError("That gallery isn’t live yet.");
      else setMatched(sample);
      return;
    }
    setLooking(true);
    try {
      const found = await lookupPublicGalleryByCode({ data: { code } });
      if (!found) setCodeError("No event matches that code.");
      else if (found.event.photoCount === 0) setCodeError("That gallery isn’t live yet.");
      else setMatched(found.event);
    } catch {
      setCodeError("No event matches that code.");
    } finally {
      setLooking(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-5">
          <Link to="/photos" className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg">
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <span className="text-sm text-accent">Event or code</span>
          <span className="w-12" />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="font-display text-3xl text-fg">Which event were you at?</h1>
        <p className="mt-2 text-muted">Search the list, or enter the code from the room. No account needed.</p>

        <label className="mt-8 block text-sm text-muted" htmlFor="event-code">
          Event code
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="event-code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setCodeError(null);
              setMatched(null);
            }}
            placeholder="ATL-404"
            className="h-12 flex-1 rounded-xl border border-border bg-surface px-4 tracking-widest text-fg placeholder:text-subtle outline-none focus:border-accent"
          />
          {openTarget && openTarget.photoCount > 0 ? (
            <Link
              to="/events/$slug"
              params={{ slug: openTarget.slug }}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-5 font-semibold text-accent-fg"
            >
              Open
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <button
              type="button"
              className="h-12 rounded-full bg-accent px-5 font-semibold text-accent-fg disabled:opacity-40"
              disabled={code.trim().length < 3 || looking}
              onClick={() => void openCode()}
            >
              {looking ? "Looking…" : "Open"}
            </button>
          )}
        </div>
        {openTarget && openTarget.photoCount > 0 ? (
          <p className="mt-2 text-sm text-accent">
            {openTarget.title} · {openTarget.neighborhood}
          </p>
        ) : null}
        {codeError ? <p className="mt-2 text-sm text-live">{codeError}</p> : null}
        <p className="mt-2 text-xs text-subtle">Try ATL-404, ATL-BELT, ATL-O4W, ATL-INVEST, or ATL-WTAE.</p>

        <div className="relative mt-10">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, neighborhoods, venues"
            className="h-12 w-full rounded-xl border border-border bg-surface pl-12 pr-4 text-fg placeholder:text-subtle outline-none focus:border-accent"
          />
        </div>
        <div className="mt-6 space-y-3">
          {filtered.map((event) => (
            <Link
              key={event.slug}
              to="/events/$slug"
              params={{ slug: event.slug }}
              className="group flex items-center justify-between rounded-xl border border-border bg-surface p-5 hover:border-accent/40"
            >
              <div>
                <h2 className="font-medium text-fg">{event.title}</h2>
                <p className="mt-1 text-sm text-muted">
                  {event.neighborhood} · {event.date}
                  {event.photoCount > 0 ? ` · ${event.code}` : ""}
                </p>
              </div>
              <ArrowRight className="size-5 text-accent opacity-0 group-hover:opacity-100" />
            </Link>
          ))}
          {filtered.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface py-10 text-center text-muted">
              No events match that search.
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
