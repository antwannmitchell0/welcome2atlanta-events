import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Camera, ScanFace } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { HighlightReel } from "@/components/highlight-reel";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { events } from "@/lib/events";
import { neighborhoods } from "@/lib/reel";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <img
          src="/reel/skyline.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-bg/70" />
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 text-center md:pt-24">
          <p className="mb-5 text-xs tracking-[0.28em] text-accent">WELCOME TO ATLANTA</p>
          <h1 className="font-display text-4xl leading-[1.08] tracking-tight text-fg md:text-6xl lg:text-7xl">
            This is The A.
            <br />
            <span className="text-accent">Now find yourself in it.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted md:text-lg">
            Cookouts. BeltLine sunsets. Midtown after-hours. The Fourth Ward. If you were in the city, the photos are here.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/photos"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-accent-fg"
            >
              <Camera className="size-4" />
              Find my photos
            </Link>
            <Link
              to="/photos/face"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-surface px-7 text-sm font-medium text-fg"
            >
              <ScanFace className="size-4" />
              Scan my face
            </Link>
          </div>
        </div>
      </section>

      <div className="border-y border-border bg-surface py-3">
        <p className="mx-auto max-w-6xl px-5 text-center text-xs tracking-[0.18em] text-muted">
          {neighborhoods.join("  ·  ")}
        </p>
      </div>

      <HighlightReel />

      <section className="border-b border-border py-16">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 md:grid-cols-3">
          <Door
            to="/photos"
            kicker="GUESTS"
            title="Find your photos"
            body="Event or code first. Face scan if you want it."
          />
          <Door
            to="/events"
            kicker="ORGANIZERS"
            title="Bring WTAE"
            body="Tell us the date. We cover the room and deliver the gallery."
          />
          <Door
            to="/creators"
            kicker="PHOTOGRAPHERS"
            title="Shoot with us"
            body="Name, city, Instagram, availability. Five minutes."
          />
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.2em] text-accent">IN THE CITY</p>
              <h2 className="mt-1 font-display text-3xl text-fg">What’s live in Atlanta</h2>
            </div>
            <Link to="/explore" className="hidden text-sm text-accent md:inline">
              All neighborhoods →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.slug} event={event} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 text-center">
        <h2 className="font-display text-3xl text-fg md:text-5xl">
          The city too busy to hate
          <br />
          <span className="text-accent">never stops being photographed.</span>
        </h2>
        <p className="mt-4 text-muted">404 energy. Your night. Your gallery.</p>
        <Link
          to="/photos"
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-8 text-sm font-semibold text-accent-fg"
        >
          Find my photos
          <ArrowRight className="size-4" />
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}

function Door({
  to,
  kicker,
  title,
  body,
}: {
  to: "/photos" | "/events" | "/creators";
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent/40"
    >
      <p className="text-xs tracking-[0.18em] text-accent">{kicker}</p>
      <h3 className="mt-2 font-display text-2xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </Link>
  );
}
