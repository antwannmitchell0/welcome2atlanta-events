"use client";

import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LiveBadge } from "@/components/live-badge";
import { getPortalEventCatalog } from "@/lib/wtae-data";
import type { EventRecord } from "@/lib/events";

export const Route = createFileRoute("/portal/events")({ component: PortalEvents });

function PortalEvents() {
  const [rows, setRows] = useState<EventRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPortalEventCatalog()
      .then(setRows)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load."));
  }, []);

  if (error) {
    return <p className="text-live">{error === "Forbidden" ? "Founders only." : error}</p>;
  }
  if (!rows) return <p className="text-muted">Loading events…</p>;

  return (
    <div>
      <h1 className="font-hero text-5xl">EVENTS</h1>
      <p className="mt-2 text-muted">
        Read-only operational visibility of the curated public catalog. Create, edit, publish,
        unpublish, LIVE, schedule, archive, codes, and homepage control ship in the Founder Event
        Manager — not this preview.
      </p>
      <div className="mt-8 space-y-3">
        {rows.map((event) => (
          <Link
            key={event.slug}
            to="/events/$slug"
            params={{ slug: event.slug }}
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface p-4 hover:border-gold/40"
          >
            <div>
              <p className="font-medium">{event.title}</p>
              <p className="text-sm text-muted">
                {event.neighborhood} · {event.date} · {event.category}
              </p>
            </div>
            {event.status === "live" ? (
              <LiveBadge compact />
            ) : (
              <span className="font-hero text-sm text-gold">{event.status.toUpperCase()}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
