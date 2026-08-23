"use client";

import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Calendar, Camera, MapPin, Share2 } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { LiveBadge } from "@/components/live-badge";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getEvent, relatedEvents } from "@/lib/events";
import { reelFrames } from "@/lib/reel";

export const Route = createFileRoute("/events/$slug")({
  component: EventPage,
  head: ({ params }) => {
    const event = getEvent(params.slug);
    return {
      meta: [
        { title: event ? `${event.title} · WTAE` : "Event · WTAE" },
        { name: "description", content: event?.description ?? "Atlanta event on WTAE." },
      ],
    };
  },
});

function EventPage() {
  const { slug } = Route.useParams();
  const event = getEvent(slug);
  if (!event) throw notFound();
  const related = relatedEvents(slug);
  const gallery = [event.image, ...reelFrames.map((frame) => frame.src)].filter(
    (src, i, arr) => arr.indexOf(src) === i,
  );

  return (
    <div className="min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <div className="overflow-hidden rounded-md border border-border">
          <img src={event.image} alt={event.title} className="h-64 w-full object-cover md:h-96" />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {event.status === "live" ? (
            <LiveBadge />
          ) : (
            <p className="font-hero text-sm text-gold">{event.status.toUpperCase()}</p>
          )}
          <p className="text-xs uppercase tracking-widest text-gold">
            {event.category} · {event.neighborhood}
          </p>
        </div>
        <h1 className="mt-3 font-hero text-5xl md:text-7xl">{event.title}</h1>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <span className="inline-flex items-center gap-2">
            <MapPin className="size-4 text-gold" />
            {event.neighborhood} · {event.venue}
          </span>
          <span className="inline-flex items-center gap-2">
            <Calendar className="size-4 text-gold" />
            {event.date}
            {event.time ? ` · ${event.time}` : ""}
          </span>
          {event.photoCount > 0 ? (
            <span className="inline-flex items-center gap-2">
              <Camera className="size-4 text-gold" />
              {event.photoCount.toLocaleString()} photos · {event.code}
            </span>
          ) : null}
        </div>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{event.description}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {event.photoCount > 0 ? (
            <Link
              to="/photos"
              className="inline-flex h-12 items-center rounded-full bg-gold px-6 font-semibold text-gold-fg"
              data-track="event-cta"
            >
              Find my photos
            </Link>
          ) : null}
          <ShareButton title={event.title} />
        </div>

        {event.photoCount > 0 ? (
          <div className="mt-12">
            <h2 className="font-hero text-4xl">GALLERY</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {gallery.slice(0, 8).map((src) => (
                <div key={src} className="overflow-hidden rounded-md bg-elevated">
                  <img src={src} alt="" className="aspect-[4/5] w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-12 rounded-md border border-border bg-surface py-16 text-center">
            <Camera className="mx-auto size-10 text-gold" />
            <h3 className="mt-4 font-hero text-3xl">Gallery coming soon</h3>
            <p className="mt-2 text-muted">Photos appear here once the event is live.</p>
          </div>
        )}

        {related.length > 0 ? (
          <div className="mt-16">
            <h2 className="font-hero text-4xl">MORE IN THE CITY</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <EventCard key={item.slug} event={item} />
              ))}
            </div>
          </div>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}

function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex h-12 items-center gap-2 rounded-full border border-border px-6 text-sm"
      data-track="event-shared"
      onClick={() => {
        const url = window.location.href;
        if (navigator.share) {
          void navigator.share({ title, url }).catch(() => undefined);
        } else {
          void navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          });
        }
      }}
    >
      <Share2 className="size-4" />
      {copied ? "Copied" : "Share"}
    </button>
  );
}
