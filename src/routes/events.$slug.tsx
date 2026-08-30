import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Camera, MapPin, Calendar } from "lucide-react";
import { reelFrames } from "@/lib/reel";
import { getPublicGallery, type PublicGalleryPhoto } from "@/lib/portal/public-galleries";

export const Route = createFileRoute("/events/$slug")({
  loader: async ({ params }) => {
    const gallery = await getPublicGallery({ data: { slug: params.slug } });
    if (!gallery) throw notFound();
    return gallery;
  },
  component: EventPage,
});

function EventPage() {
  const { kind, event, photos } = Route.useLoaderData();
  const sampleSources =
    kind === "sample"
      ? [event.image, ...reelFrames.map((frame) => frame.src)].filter((src, i, arr) => arr.indexOf(src) === i).slice(0, 8)
      : [];
  const dbSources = kind === "database" ? photos : [];
  const showGallery = event.photoCount > 0;

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-5">
          <Link to="/explore" className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg">
            <ArrowLeft className="size-4" />
            All Events
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-12">
        <div className="overflow-hidden rounded-xl border border-border">
          <img src={event.image} alt="" className="h-64 w-full object-cover md:h-80" />
        </div>
        <p
          className={
            event.status === "live"
              ? "mt-6 inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-live"
              : "mt-6 inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-accent"
          }
        >
          {event.status === "live" ? <span className="size-1.5 rounded-full bg-live" /> : null}
          {event.status.toUpperCase()}
        </p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">{event.title}</h1>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <span className="inline-flex items-center gap-2">
            <MapPin className="size-4 text-accent" />
            {event.neighborhood} · {event.venue}
          </span>
          <span className="inline-flex items-center gap-2">
            <Calendar className="size-4 text-accent" />
            {event.date}
          </span>
          {event.photoCount > 0 ? (
            <span className="inline-flex items-center gap-2">
              <Camera className="size-4 text-accent" />
              {event.photoCount.toLocaleString()} photos · {event.code}
            </span>
          ) : null}
        </div>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{event.description}</p>
        {event.photoCount > 0 ? (
          <Link
            to="/photos"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-accent px-6 font-semibold text-accent-fg"
          >
            Find My Photos in This Gallery
          </Link>
        ) : null}

        {showGallery ? (
          <div className="mt-12">
            <div className="mb-5 flex items-end justify-between">
              <h2 className="font-display text-2xl">Gallery</h2>
              <p className="text-sm text-subtle">{event.photoCount.toLocaleString()} moments</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {kind === "sample"
                ? sampleSources.map((src) => (
                    <div key={src} className="overflow-hidden rounded-lg bg-elevated">
                      <img src={src} alt="" className="aspect-[4/5] w-full object-cover" />
                    </div>
                  ))
                : dbSources.map((photo: PublicGalleryPhoto) => (
                    <div key={photo.id} className="overflow-hidden rounded-lg bg-elevated">
                      <img src={photo.src} alt="" className="aspect-[4/5] w-full object-cover" />
                    </div>
                  ))}
            </div>
          </div>
        ) : (
          <div className="mt-12 rounded-xl border border-border bg-surface py-16 text-center">
            <Camera className="mx-auto size-10 text-accent" />
            <h3 className="mt-4 font-display text-xl">Gallery coming soon</h3>
            <p className="mt-2 text-muted">Photos appear here once the event is live.</p>
          </div>
        )}
      </main>
    </div>
  );
}
