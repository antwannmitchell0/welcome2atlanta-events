import { Link } from "@tanstack/react-router";
import { LiveBadge } from "@/components/live-badge";
import type { EventRecord } from "@/lib/events";

export function EventCard({ event }: { event: EventRecord }) {
  return (
    <Link
      to="/events/$slug"
      params={{ slug: event.slug }}
      className="group block overflow-hidden rounded-md border border-border bg-surface transition-colors hover:border-gold/50"
      data-track="event-card"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-elevated">
        <img
          src={event.image}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3">
          {event.status === "live" ? (
            <span className="inline-flex rounded-sm bg-bg/80 px-2 py-1">
              <LiveBadge compact />
            </span>
          ) : (
            <span className="rounded-sm bg-bg/80 px-2 py-1 font-hero text-xs text-gold">
              {event.status.toUpperCase()}
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs uppercase tracking-widest text-gold">
          {event.category} · {event.neighborhood}
        </p>
        <h3 className="mt-1 font-hero text-2xl text-fg">{event.title}</h3>
        <p className="mt-2 text-sm text-muted">
          {event.date}
          {event.time ? ` · ${event.time}` : ""}
        </p>
        <p className="mt-1 text-sm text-subtle">{event.venue}</p>
      </div>
    </Link>
  );
}
