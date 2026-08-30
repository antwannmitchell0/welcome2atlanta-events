import { createFileRoute, Link } from "@tanstack/react-router";
import { listOwnerEvents } from "@/lib/portal/events";
import type { GalleryEventRow } from "@/lib/portal/event-input";

export const Route = createFileRoute("/portal/")({
  loader: () => listOwnerEvents(),
  pendingComponent: () => <p className="text-muted">Loading Mission Control…</p>,
  errorComponent: ({ error }) => (
    <p className="text-live">{error.message === "Unauthorized" || error.message === "Forbidden" ? "Owner access required." : error.message}</p>
  ),
  component: Dashboard,
});

function Dashboard() {
  const data = Route.useLoaderData() as { events: GalleryEventRow[]; sampleCount: number };
  const rows = data.events;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.2em] text-accent">OWNER PORTAL</p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl">WTAE Mission Control</h1>
        </div>
        <Link
          to="/portal/events/new"
          className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 font-semibold text-accent-fg"
        >
          Create Event
        </Link>
      </div>
      <p className="text-sm text-subtle">{data.sampleCount} sample galleries stay on the public site.</p>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface py-16 text-center text-muted">
          No database events yet. Create an event folder to start uploading.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((event) => (
            <EventRowCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventRowCard({ event }: { event: GalleryEventRow }) {
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 md:flex-row md:items-center">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{event.name}</p>
        <p className="text-sm text-muted">
          {event.event_date} · {event.venue || event.neighborhood || "Atlanta"} · {event.event_code}
        </p>
        <p className="text-xs text-subtle">
          {event.status} · {event.photo_count} photos
        </p>
      </div>
      <Link
        to="/portal/events/$id"
        params={{ id: event.id }}
        className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm"
      >
        Manage
      </Link>
    </article>
  );
}
