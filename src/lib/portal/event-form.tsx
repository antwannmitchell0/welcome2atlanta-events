"use client";

import { useState, type FormEvent } from "react";
import type { EventInput, GalleryEventRow } from "./event-input";

const fieldClass =
  "mt-2 h-12 w-full rounded-xl border border-border bg-surface px-4 outline-none focus:border-accent";

export function EventForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<GalleryEventRow>;
  submitLabel: string;
  onSubmit: (data: EventInput) => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: EventInput = {
      name: String(form.get("name") ?? ""),
      slug: String(form.get("slug") ?? ""),
      eventCode: String(form.get("eventCode") ?? ""),
      eventDate: String(form.get("eventDate") ?? ""),
      startTime: String(form.get("startTime") ?? ""),
      venue: String(form.get("venue") ?? ""),
      neighborhood: String(form.get("neighborhood") ?? ""),
      description: String(form.get("description") ?? ""),
    };
    setBusy(true);
    setError(null);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the event.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <label className="block text-sm text-muted">
        Event name
        <input name="name" required minLength={2} defaultValue={initial?.name} className={fieldClass} />
      </label>
      <label className="block text-sm text-muted">
        Event date
        <input name="eventDate" required defaultValue={initial?.event_date} placeholder="2026-09-01 or Saturday" className={fieldClass} />
      </label>
      <label className="block text-sm text-muted">
        Start time
        <input name="startTime" defaultValue={initial?.start_time ?? ""} className={fieldClass} />
      </label>
      <label className="block text-sm text-muted">
        Venue
        <input name="venue" defaultValue={initial?.venue} className={fieldClass} />
      </label>
      <label className="block text-sm text-muted">
        Neighborhood
        <input name="neighborhood" defaultValue={initial?.neighborhood} className={fieldClass} />
      </label>
      <label className="block text-sm text-muted">
        Slug (optional)
        <input name="slug" defaultValue={initial?.slug} placeholder="auto from name" className={fieldClass} />
      </label>
      <label className="block text-sm text-muted">
        Event code (optional)
        <input name="eventCode" defaultValue={initial?.event_code} placeholder="ATL-NIGHT" className={fieldClass} />
      </label>
      <label className="block text-sm text-muted">
        Description
        <textarea
          name="description"
          rows={4}
          defaultValue={initial?.description}
          className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
        />
      </label>
      {error ? (
        <p className="text-sm text-live" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 font-semibold text-accent-fg disabled:opacity-60"
      >
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
