"use client";

import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getPortalOverview } from "@/lib/wtae-data";

export const Route = createFileRoute("/portal/")({ component: Overview });

function Overview() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getPortalOverview>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPortalOverview()
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load."));
  }, []);

  if (error) {
    return (
      <div>
        <h1 className="font-hero text-5xl">ACCESS</h1>
        <p className="mt-3 text-muted">{error === "Forbidden" ? "This portal is for WTAE founders only." : error}</p>
      </div>
    );
  }
  if (!data) return <p className="text-muted">Loading metrics…</p>;

  return (
    <div>
      <h1 className="font-hero text-5xl">OVERVIEW</h1>
      <p className="mt-2 text-muted">Live numbers from the database. Empty is honest.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric
          to="/portal/events"
          label="Live events"
          value={data.events.live}
          hint={`${data.events.upcoming} upcoming · ${data.events.past} past`}
        />
        <Metric
          to="/portal/events"
          label="All events"
          value={data.events.total}
          hint="Canonical public list"
        />
        <Metric
          to="/portal/requests"
          label="New requests"
          value={data.requests.new}
          hint={`${data.requests.reviewing} in review · ${data.requests.total} total`}
        />
        <Metric
          to="/portal/requests"
          label="Approved coverage"
          value={data.requests.approved}
          hint="Requests marked approved"
        />
        <Metric
          to="/portal/photographers"
          label="New applications"
          value={data.photographers.new}
          hint={`${data.photographers.reviewing} in review · ${data.photographers.total} total`}
        />
        <Metric
          to="/portal/photographers"
          label="Approved photographers"
          value={data.photographers.approved}
          hint="Ready to assign"
        />
      </div>
    </div>
  );
}

function Metric({
  to,
  label,
  value,
  hint,
}: {
  to: "/portal/events" | "/portal/requests" | "/portal/photographers";
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <Link to={to} className="rounded-md border border-border bg-surface p-5 hover:border-gold/40">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-hero text-5xl tabular-nums text-gold">{value}</p>
      <p className="mt-2 text-sm text-subtle">{hint}</p>
    </Link>
  );
}
