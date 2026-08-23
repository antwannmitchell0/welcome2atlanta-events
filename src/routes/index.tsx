import { createFileRoute, Link } from "@tanstack/react-router";
import { EventCard } from "@/components/event-card";
import { HighlightReel } from "@/components/highlight-reel";
import { LiveBadge } from "@/components/live-badge";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { categoriesInUse, categoryArt, liveEvents, weekendEvents } from "@/lib/events";
import { neighborhoods } from "@/lib/reel";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const live = liveEvents();
  const weekend = weekendEvents();
  const categories = categoriesInUse();

  return (
    <div className="min-h-screen bg-bg text-fg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Welcome To Atlanta Events",
            alternateName: "WTAE",
            email: "hello@welcome2atlantaevents.com",
            description: "Atlanta event discovery and event photography.",
          }),
        }}
      />
      <SiteHeader />

      <section className="relative overflow-hidden">
        <img
          src="/reel/skyline.jpg"
          alt="Atlanta skyline at night"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-linear-to-b from-bg/40 via-bg/70 to-bg" />
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 md:pt-24">
          <p className="mb-4 inline-flex items-center gap-3 rounded-sm border border-border bg-bg/60 px-3 py-1.5">
            <LiveBadge />
            <span className="text-xs uppercase tracking-[0.2em] text-muted">Atlanta is in session</span>
          </p>
          <h1 className="font-hero text-6xl text-fg sm:text-8xl md:text-9xl">
            ATLANTA
            <br />
            <span className="text-gold">IS HAPPENING.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base text-muted md:text-lg">
            Discover the city. Find the moment. Be part of Atlanta.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/explore"
              className="inline-flex h-12 items-center justify-center rounded-full bg-gold px-7 text-sm font-semibold text-gold-fg"
              data-track="hero-explore"
            >
              Explore Events
            </Link>
            <Link
              to="/events"
              className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-bg/70 px-7 text-sm font-medium text-fg"
              data-track="hero-cover"
            >
              Get Your Event Covered
            </Link>
          </div>
        </div>
      </section>

      <div className="border-y border-border bg-surface py-3">
        <p className="mx-auto max-w-6xl px-5 text-center font-hero text-sm tracking-[0.18em] text-muted">
          {neighborhoods.join("  ·  ")}
        </p>
      </div>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <LiveBadge />
              <h2 className="mt-2 font-hero text-5xl text-fg">HAPPENING NOW</h2>
            </div>
            <Link to="/explore" className="hidden text-sm text-gold md:inline">
              All events →
            </Link>
          </div>
          {live.length === 0 ? (
            <p className="text-muted">Nothing live this minute. Check This Weekend.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {live.map((event) => (
                <EventCard key={event.slug} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-border bg-surface py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-hero text-5xl text-fg">THIS WEEKEND IN ATLANTA</h2>
          <p className="mt-2 text-muted">Nights worth leaving the house for.</p>
          {weekend.length === 0 ? (
            <p className="mt-8 text-muted">No weekend listings yet.</p>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {weekend.map((event) => (
                <EventCard key={event.slug} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      <HighlightReel />

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-hero text-5xl text-fg">EXPLORE ATLANTA YOUR WAY</h2>
          <p className="mt-2 text-muted">Only categories with live WTAE coverage.</p>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category}
                to="/explore"
                search={{ category }}
                className="group relative overflow-hidden rounded-md"
                data-track="category-selected"
              >
                <img
                  src={categoryArt[category]}
                  alt=""
                  className="aspect-[16/10] w-full object-cover opacity-70 transition-opacity group-hover:opacity-90"
                />
                <span className="absolute inset-x-0 bottom-0 bg-bg/70 px-4 py-3 font-hero text-2xl">{category}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 md:grid-cols-2">
          <div>
            <p className="font-hero text-sm tracking-[0.2em] text-gold">ORGANIZERS</p>
            <h2 className="mt-2 font-hero text-5xl">GET YOUR EVENT COVERED</h2>
            <p className="mt-4 max-w-md text-muted">
              We shoot the room. Guests find themselves. Atlanta remembers the night.
            </p>
            <Link
              to="/events"
              className="mt-8 inline-flex h-12 items-center rounded-full bg-gold px-6 text-sm font-semibold text-gold-fg"
            >
              Request coverage
            </Link>
          </div>
          <div>
            <p className="font-hero text-sm tracking-[0.2em] text-gold">PHOTOGRAPHERS</p>
            <h2 className="mt-2 font-hero text-5xl">SHOOT THE CITY</h2>
            <p className="mt-4 max-w-md text-muted">
              Independent shooters. Clear offers. Work that actually gets seen.
            </p>
            <Link
              to="/creators"
              className="mt-8 inline-flex h-12 items-center rounded-full border border-gold px-6 text-sm font-semibold text-gold"
            >
              Apply to shoot
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 text-center">
        <h2 className="font-hero text-5xl text-fg md:text-7xl">
          THE CITY TOO BUSY TO HATE
          <br />
          <span className="text-gold">NEVER STOPS BEING PHOTOGRAPHED.</span>
        </h2>
        <Link
          to="/explore"
          className="mt-10 inline-flex h-12 items-center rounded-full bg-gold px-8 text-sm font-semibold text-gold-fg"
        >
          Explore Events
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
