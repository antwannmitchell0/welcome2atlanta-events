"use client";

import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { getGalleryEvent, setEventStatus } from "@/lib/portal/events";
import type { GalleryEventStatus } from "@/lib/portal/event-input";
import { PhotoManager } from "@/lib/portal/photo-manager";
import { PhotoUploader } from "@/lib/portal/photo-uploader";

export const Route = createFileRoute("/portal/events/$id")({
  loader: ({ params }) => getGalleryEvent({ data: { id: params.id } }),
  pendingComponent: () => <p className="text-muted">Loading event…</p>,
  errorComponent: ({ error }) => <p className="text-live">{error.message}</p>,
  component: EventDetail,
  head: () => ({
    meta: [{ title: "Event · WTAE" }, { name: "robots", content: "noindex" }],
  }),
});

function EventDetail() {
  const { event, photos } = Route.useLoaderData();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    await router.invalidate();
  }

  async function changeStatus(status: GalleryEventStatus) {
    setBusy(true);
    setMessage(null);
    try {
      await setEventStatus({ data: { id: event.id, status } });
      setMessage(status === "published" ? "Event published." : `Event marked ${status}.`);
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(`${label} copied.`);
    } catch {
      setMessage(`Copy failed. ${text}`);
    }
  }

  return (
    <div className="space-y-8">
      <Link to="/portal" className="text-sm text-muted hover:text-fg">
        Back to events
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.2em] text-accent">{event.status.toUpperCase()}</p>
          <h1 className="mt-2 font-display text-4xl">{event.name}</h1>
          <p className="mt-2 text-sm text-muted">
            {event.event_date} · {event.venue || event.neighborhood || "Atlanta"}
          </p>
        </div>
        <Link
          to="/portal/events/$id/edit"
          params={{ id: event.id }}
          className="inline-flex min-h-11 items-center rounded-full border border-border px-4"
        >
          Edit details
        </Link>
      </div>

      <dl className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-subtle">Event code</dt>
          <dd className="mt-1 font-medium">{event.event_code}</dd>
        </div>
        <div>
          <dt className="text-xs text-subtle">Slug</dt>
          <dd className="mt-1 font-medium">{event.slug}</dd>
        </div>
        <div>
          <dt className="text-xs text-subtle">Ready photos</dt>
          <dd className="mt-1 font-medium">{event.photo_count}</dd>
        </div>
        <div>
          <dt className="text-xs text-subtle">Failed uploads</dt>
          <dd className="mt-1 font-medium">{event.failed_count}</dd>
        </div>
      </dl>

      {event.description ? <p className="max-w-2xl text-muted">{event.description}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="min-h-11 rounded-full border border-border px-4 text-sm"
          onClick={() => void copy(event.event_code, "Event code")}
        >
          Copy event code
        </button>
        <button
          type="button"
          className="min-h-11 rounded-full border border-border px-4 text-sm"
          onClick={() => void copy(`${window.location.origin}/events/${event.slug}`, "Gallery URL")}
        >
          Copy public gallery URL
        </button>
        {event.status !== "published" ? (
          <button
            type="button"
            disabled={busy}
            className="min-h-11 rounded-full bg-accent px-4 text-sm font-semibold text-accent-fg disabled:opacity-60"
            onClick={() => void changeStatus("published")}
          >
            Publish
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            className="min-h-11 rounded-full border border-border px-4 text-sm disabled:opacity-60"
            onClick={() => void changeStatus("draft")}
          >
            Unpublish
          </button>
        )}
        {event.status !== "archived" ? (
          <button
            type="button"
            disabled={busy}
            className="min-h-11 rounded-full border border-border px-4 text-sm disabled:opacity-60"
            onClick={() => void changeStatus("archived")}
          >
            Archive
          </button>
        ) : null}
      </div>
      {message ? <p className="text-sm text-accent">{message}</p> : null}

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-2xl">Upload</h2>
          <p className="mt-1 text-sm text-muted">Originals stay private. Public pages only receive EXIF-stripped derivatives.</p>
        </div>
        <PhotoUploader eventId={event.id} onChanged={() => void refresh()} />
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl">Manage photos</h2>
        <PhotoManager
          eventId={event.id}
          coverPhotoId={event.cover_photo_id}
          photos={photos}
          onChanged={() => void refresh()}
        />
      </section>
    </div>
  );
}
