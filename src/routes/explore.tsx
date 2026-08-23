import { createFileRoute, Link } from "@tanstack/react-router";
import { EventCard } from "@/components/event-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { categoriesInUse, events, type EventCategory } from "@/lib/events";

type ExploreSearch = { category?: EventCategory };

export const Route = createFileRoute("/explore")({
  validateSearch: (search: Record<string, unknown>): ExploreSearch => ({
    category: typeof search.category === "string" ? (search.category as EventCategory) : undefined,
  }),
  component: Explore,
  head: () => ({
    meta: [
      { title: "Explore Atlanta Events · WTAE" },
      { name: "description", content: "Nightlife, music, festivals, business, and culture happening in Atlanta." },
    ],
  }),
});

function Explore() {
  const { category } = Route.useSearch();
  const categories = categoriesInUse();
  const filtered = category ? events.filter((event) => event.category === category) : events;

  return (
    <div className="min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-16">
        <p className="font-hero text-sm tracking-[0.24em] text-gold">ATLANTA, LIVE</p>
        <h1 className="mt-2 font-hero text-6xl md:text-7xl">WHAT’S HAPPENING</h1>
        <p className="mt-3 text-lg text-muted">Midtown to the BeltLine. The Fourth Ward to SWATS.</p>
        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            to="/explore"
            className={
              !category
                ? "inline-flex min-h-11 items-center rounded-full bg-gold px-4 py-2 text-sm font-medium text-gold-fg"
                : "inline-flex min-h-11 items-center rounded-full border border-border px-4 py-2 text-sm text-muted hover:text-fg"
            }
          >
            All
          </Link>
          {categories.map((item) => (
            <Link
              key={item}
              to="/explore"
              search={{ category: item }}
              className={
                category === item
                  ? "inline-flex min-h-11 items-center rounded-full bg-gold px-4 py-2 text-sm font-medium text-gold-fg"
                  : "inline-flex min-h-11 items-center rounded-full border border-border px-4 py-2 text-sm text-muted hover:text-fg"
              }
            >
              {item}
            </Link>
          ))}
        </div>
        {filtered.length === 0 ? (
          <p className="mt-16 text-muted">No events in that category yet.</p>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event) => (
              <EventCard key={event.slug} event={event} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
