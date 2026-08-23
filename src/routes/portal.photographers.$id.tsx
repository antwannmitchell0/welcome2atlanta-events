"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getPhotographerApplication, updatePhotographerApplication, type PhotographerRow } from "@/lib/wtae-data";

export const Route = createFileRoute("/portal/photographers/$id")({ component: PhotographerDetail });

const statuses = ["new", "reviewing", "interview", "approved", "declined"] as const;

function PhotographerDetail() {
  const { id } = Route.useParams();
  const num = Number(id);
  const [row, setRow] = useState<PhotographerRow | null | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPhotographerApplication({ data: { id: num } })
      .then(setRow)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load.");
        setRow(null);
      });
  }, [num]);

  if (row === undefined) return <p className="text-muted">Loading…</p>;
  if (!row) return <p className="text-muted">{error ?? "Application not found."}</p>;

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    const form = new FormData(e.currentTarget);
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await updatePhotographerApplication({
        data: {
          id: num,
          status: String(form.get("status")) as PhotographerRow["status"],
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

  const instagram = row.instagram.replace(/^@/, "");

  return (
    <div>
      <Link to="/portal/photographers" className="text-sm text-muted hover:text-fg">
        ← Photographers
      </Link>
      <h1 className="mt-4 font-hero text-5xl">{row.full_name}</h1>
      <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        <Item label="Email" value={row.email} href={`mailto:${row.email}`} />
        <Item label="Phone" value={row.phone} href={row.phone ? `tel:${row.phone}` : undefined} />
        <Item label="City" value={row.city} />
        <Item label="Instagram" value={`@${instagram}`} href={`https://instagram.com/${instagram}`} />
        <Item label="Portfolio" value={row.portfolio_url} href={row.portfolio_url ?? undefined} />
        <Item label="Years" value={row.years_experience} />
        <Item label="Kit" value={row.camera_equipment} />
        <Item label="Transport" value={row.transportation} />
        <Item label="Availability" value={row.availability} />
        <Item label="Experience" value={row.event_experience} />
        <Item label="Why WTAE" value={row.why_wtae} />
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
          <a href={href} className="text-gold hover:text-fg" target="_blank" rel="noreferrer">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
