"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getEventRequest, updateEventRequest, type EventRequestRow } from "@/lib/wtae-data";

export const Route = createFileRoute("/portal/requests/$id")({ component: RequestDetail });

const statuses = ["new", "reviewing", "contacted", "approved", "declined", "completed"] as const;

function RequestDetail() {
  const { id } = Route.useParams();
  const num = Number(id);
  const [row, setRow] = useState<EventRequestRow | null | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEventRequest({ data: { id: num } })
      .then(setRow)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load.");
        setRow(null);
      });
  }, [num]);

  if (row === undefined) return <p className="text-muted">Loading…</p>;
  if (!row) return <p className="text-muted">{error ?? "Request not found."}</p>;

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    const form = new FormData(e.currentTarget);
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await updateEventRequest({
        data: {
          id: num,
          status: String(form.get("status")) as EventRequestRow["status"],
          founder_notes: String(form.get("founder_notes") ?? ""),
        },
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Link to="/portal/requests" className="text-sm text-muted hover:text-fg">
        ← Requests
      </Link>
      <h1 className="mt-4 font-hero text-5xl">{row.event_name}</h1>
      <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        <Item label="Requester" value={row.requester_name} />
        <Item label="Email" value={row.email} href={`mailto:${row.email}`} />
        <Item label="Phone" value={row.phone} href={row.phone ? `tel:${row.phone}` : undefined} />
        <Item label="Type" value={row.event_type} />
        <Item label="Date" value={row.event_date} />
        <Item label="Time" value={row.event_time} />
        <Item label="Venue" value={row.venue_name} />
        <Item label="Address" value={row.venue_address} />
        <Item label="Attendance" value={row.expected_attendance} />
        <Item label="Instagram" value={row.instagram} />
        <Item label="Link" value={row.website_or_event_link} href={row.website_or_event_link ?? undefined} />
        <Item label="Coverage" value={row.coverage_requested} />
        <Item label="Message" value={row.message} />
      </dl>
      <form onSubmit={(e) => void onSave(e)} className="mt-8 max-w-lg space-y-4">
        <label className="block text-sm">
          <span className="mb-2 block text-muted">Status</span>
          <select name="status" defaultValue={row.status} className="h-12 w-full rounded-md border border-border bg-elevated px-4">
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-2 block text-muted">Private notes</span>
          <textarea
            name="founder_notes"
            defaultValue={row.founder_notes ?? ""}
            rows={4}
            className="w-full rounded-md border border-border bg-elevated px-4 py-3"
          />
        </label>
        <button type="submit" disabled={saving} className="h-11 rounded-full bg-gold px-6 font-semibold text-gold-fg disabled:opacity-60">
          {saving ? "Saving…" : "Save"}
        </button>
        {saved ? <p className="text-sm text-gold">Saved.</p> : null}
        {error ? <p className="text-sm text-live">{error}</p> : null}
      </form>
    </div>
  );
}

function Item({ label, value, href }: { label: string; value: string | null; href?: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-subtle">{label}</dt>
      <dd className="mt-1">
        {href ? (
          <a href={href} className="text-gold hover:text-fg">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
