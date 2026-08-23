"use client";

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Search } from "lucide-react";
import { PhotosHeader } from "@/components/photos-header";
import { events, getEventByCode } from "@/lib/events";

export const Route = createFileRoute("/photos/event")({ component: SearchByEvent });

function SearchByEvent() {
  const [query, setQuery] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const matched = getEventByCode(code);

  const filtered = events.filter((event) => {
    const hay = `${event.title} ${event.venue} ${event.neighborhood} ${event.code}`.toLowerCase();
    return hay.includes(query.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-bg text-fg">
      <PhotosHeader title="Event or code" />
      <main className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="font-hero text-4xl text-fg">WHICH EVENT WERE YOU AT?</h1>
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
            }}
            placeholder="ATL-404"
            className="h-12 flex-1 rounded-md border border-border bg-elevated px-4 tracking-widest text-fg placeholder:text-subtle outline-none focus:border-gold"
          />
          {matched && matched.photoCount > 0 ? (
            <Link
              to="/events/$slug"
              params={{ slug: matched.slug }}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-gold px-5 font-semibold text-gold-fg"
            >
              Open
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <button
              type="button"
              className="h-12 rounded-full bg-gold px-5 font-semibold text-gold-fg disabled:opacity-40"
              disabled={code.trim().length < 3}
              onClick={() => {
                const event = getEventByCode(code);
                if (!event) setCodeError("No event matches that code.");
                else if (event.photoCount === 0) setCodeError("That gallery isn’t live yet.");
              }}
            >
              Open
            </button>
          )}
        </div>
        {matched && matched.photoCount > 0 ? (
          <p className="mt-2 text-sm text-gold">
            {matched.title} · {matched.neighborhood}
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
            className="h-12 w-full rounded-md border border-border bg-elevated pl-12 pr-4 text-fg placeholder:text-subtle outline-none focus:border-gold"
          />
        </div>
        <div className="mt-6 space-y-3">
          {filtered.map((event) => (
            <Link
              key={event.slug}
              to="/events/$slug"
              params={{ slug: event.slug }}
              className="group flex items-center justify-between rounded-md border border-border bg-surface p-5 hover:border-gold/40"
            >
              <div>
                <h2 className="font-medium text-fg">{event.title}</h2>
                <p className="mt-1 text-sm text-muted">
                  {event.neighborhood} · {event.date}
                  {event.photoCount > 0 ? ` · ${event.code}` : ""}
                </p>
              </div>
              <ArrowRight className="size-5 text-gold opacity-0 group-hover:opacity-100" />
            </Link>
          ))}
          {filtered.length === 0 ? (
            <p className="rounded-md border border-border bg-surface py-10 text-center text-muted">
              No events match that search.
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
