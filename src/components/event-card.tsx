import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { EventRecord } from "@/lib/events";

export function EventCard({ event }: { event: EventRecord }) {
  return (
    <Link
      to="/events/$slug"
      params={{ slug: event.slug }}
      className="group block overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-accent/40"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-elevated">
        <img
          src={event.image}
          alt=""
          className="h-full w-full object-cover opacity-80 transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span
          className={
            event.status === "live"
              ? "absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-bg/80 px-2.5 py-1 text-[10px] font-medium tracking-wide text-live"
              : "absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-bg/80 px-2.5 py-1 text-[10px] font-medium tracking-wide text-accent"
          }
        >
          {event.status === "live" ? (
            <span className="size-1.5 rounded-full bg-live" />
          ) : null}
          {event.status.toUpperCase()}
        </span>
      </div>
      <div className="p-5">
        <p className="text-xs tracking-wide text-accent">{event.neighborhood}</p>
        <h3 className="mt-1 font-display text-xl text-fg">{event.title}</h3>
        <p className="mt-4 inline-flex items-center gap-1 text-sm text-accent opacity-0 transition-opacity group-hover:opacity-100">
          View gallery
          <ArrowRight className="size-3.5" />
        </p>
      </div>
    </Link>
  );
}
