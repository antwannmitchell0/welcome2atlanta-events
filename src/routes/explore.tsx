import { createFileRoute } from "@tanstack/react-router";
import { EventCard } from "@/components/event-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { events } from "@/lib/events";

export const Route = createFileRoute("/explore")({ component: Explore });

function Explore() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="font-display text-4xl md:text-5xl">Atlanta, live</h1>
        <p className="mt-3 text-lg text-muted">
          Midtown to the BeltLine. The Fourth Ward to SWATS. What’s happening in the city.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.slug} event={event} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
