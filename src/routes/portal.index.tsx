import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/portal/")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="space-y-6">
      <p className="text-xs tracking-[0.2em] text-accent">OWNER PORTAL</p>
      <h1 className="font-display text-4xl md:text-5xl">WTAE Mission Control</h1>
      <p className="max-w-xl text-muted">
        You are signed in as an active owner. Event folders and photo uploads are next.
      </p>
    </div>
  );
}
