"use client";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { EventForm } from "@/lib/portal/event-form";
import { getGalleryEvent, updateGalleryEvent } from "@/lib/portal/events";

export const Route = createFileRoute("/portal/events/$id/edit")({
  loader: ({ params }) => getGalleryEvent({ data: { id: params.id } }),
  pendingComponent: () => <p className="text-muted">Loading event…</p>,
  errorComponent: ({ error }) => <p className="text-live">{error.message}</p>,
  component: EditEvent,
  head: () => ({
    meta: [{ title: "Edit event · WTAE" }, { name: "robots", content: "noindex" }],
  }),
});

function EditEvent() {
  const { event } = Route.useLoaderData();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Link to="/portal/events/$id" params={{ id: event.id }} className="text-sm text-muted hover:text-fg">
        Back to event
      </Link>
      <h1 className="font-display text-4xl">Edit {event.name}</h1>
      <EventForm
        initial={event}
        submitLabel="Save changes"
        onSubmit={async (data) => {
          await updateGalleryEvent({ data: { ...data, id: event.id } });
          await navigate({ to: "/portal/events/$id", params: { id: event.id } });
        }}
      />
    </div>
  );
}
