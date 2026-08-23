"use client";

import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { listEventRequests, type EventRequestRow } from "@/lib/wtae-data";

export const Route = createFileRoute("/portal/requests/")({ component: Requests });

function Requests() {
  const [rows, setRows] = useState<EventRequestRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listEventRequests()
      .then(setRows)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed."));
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = query.toLowerCase();
    return rows.filter((row) =>
      `${row.event_name} ${row.requester_name} ${row.email} ${row.status}`.toLowerCase().includes(q),
    );
  }, [rows, query]);

  if (error) return <p className="text-live">{error === "Forbidden" ? "Founders only." : error}</p>;
  if (!rows) return <p className="text-muted">Loading requests…</p>;

  return (
    <div>
      <h1 className="font-hero text-5xl">EVENT REQUESTS</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search name, event, email"
        className="mt-6 h-12 w-full max-w-md rounded-md border border-border bg-elevated px-4 outline-none focus:border-gold"
      />
      {filtered.length === 0 ? (
        <p className="mt-10 text-muted">No event requests yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((row) => (
            <Link
              key={row.id}
              to="/portal/requests/$id"
              params={{ id: String(row.id) }}
              className="block rounded-md border border-border bg-surface p-4 hover:border-gold/40"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{row.event_name}</p>
                <span className="font-hero text-sm text-gold">{row.status.toUpperCase()}</span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {row.requester_name} · {row.email} · {row.event_date || "date TBD"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
