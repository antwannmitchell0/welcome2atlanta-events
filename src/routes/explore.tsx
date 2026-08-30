import { createFileRoute } from "@tanstack/react-router";
import { EventCard } from "@/components/event-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { EventRecord } from "@/lib/events";
import { listPublicGalleries } from "@/lib/portal/public-galleries";

export const Route = createFileRoute("/explore")({
  loader: () => listPublicGalleries(),
  component: Explore,
});

function Explore() {
  const { samples, published } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="font-display text-4xl md:text-5xl">Atlanta, live</h1>
        <p className="mt-3 text-lg text-muted">
          Midtown to the BeltLine. The Fourth Ward to SWATS. What’s happening in the city.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {samples.map((event: EventRecord) => (
            <EventCard key={event.slug} event={event} />
          ))}
        </div>
        {published.length > 0 ? (
          <section className="mt-16">
            <h2 className="font-display text-3xl">Owner galleries</h2>
            <p className="mt-2 text-muted">Published nights from Mission Control. Sample rooms stay in the grid above.</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {published.map((event: EventRecord) => (
                <EventCard key={event.slug} event={event} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
