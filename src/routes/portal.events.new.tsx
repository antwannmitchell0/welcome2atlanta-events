"use client";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { EventForm } from "@/lib/portal/event-form";
import { createGalleryEvent } from "@/lib/portal/events";

export const Route = createFileRoute("/portal/events/new")({
  component: NewEvent,
  head: () => ({
    meta: [{ title: "Create event · WTAE" }, { name: "robots", content: "noindex" }],
  }),
});

function NewEvent() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Link to="/portal" className="text-sm text-muted hover:text-fg">
        Back to events
      </Link>
      <h1 className="font-display text-4xl">Create event</h1>
      <p className="max-w-xl text-sm text-muted">
        New folders start as drafts. Publishing requires at least one ready, visible photo.
      </p>
      <EventForm
        submitLabel="Create draft"
        onSubmit={async (data) => {
          const created = await createGalleryEvent({ data });
          await navigate({ to: "/portal/events/$id", params: { id: created.id } });
        }}
      />
    </div>
  );
}
