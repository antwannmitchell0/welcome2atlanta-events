"use client";

import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { listPhotographerApplications, type PhotographerRow } from "@/lib/wtae-data";

export const Route = createFileRoute("/portal/photographers/")({ component: Photographers });

function Photographers() {
  const [rows, setRows] = useState<PhotographerRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPhotographerApplications()
      .then(setRows)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed."));
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = query.toLowerCase();
    return rows.filter((row) =>
      `${row.full_name} ${row.email} ${row.city} ${row.instagram} ${row.status}`.toLowerCase().includes(q),
    );
  }, [rows, query]);

  if (error) return <p className="text-live">{error === "Forbidden" ? "Founders only." : error}</p>;
  if (!rows) return <p className="text-muted">Loading applications…</p>;

  return (
    <div>
      <h1 className="font-hero text-5xl">PHOTOGRAPHERS</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search name, city, Instagram, email"
        className="mt-6 h-12 w-full max-w-md rounded-md border border-border bg-elevated px-4 outline-none focus:border-gold"
      />
      {filtered.length === 0 ? (
        <p className="mt-10 text-muted">No photographer applications yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((row) => (
            <Link
              key={row.id}
              to="/portal/photographers/$id"
              params={{ id: String(row.id) }}
              className="block rounded-md border border-border bg-surface p-4 hover:border-gold/40"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{row.full_name}</p>
                <span className="font-hero text-sm text-gold">{row.status.toUpperCase()}</span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {row.city || "City TBD"} · {row.instagram} · {row.years_experience || "experience TBD"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
