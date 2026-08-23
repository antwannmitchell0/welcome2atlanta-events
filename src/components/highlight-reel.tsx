import { Link } from "@tanstack/react-router";
import { reelFrames } from "@/lib/reel";

export function HighlightReel() {
  const frames = [...reelFrames, ...reelFrames];

  return (
    <section className="overflow-hidden border-y border-border bg-bg py-16">
      <div className="mx-auto max-w-6xl px-5">
        <p className="font-hero text-sm tracking-[0.24em] text-gold">WTAE MOMENTS</p>
        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-xl font-hero text-5xl text-fg md:text-6xl">See yourself in The A.</h2>
          <Link
            to="/photos"
            className="inline-flex h-11 items-center justify-center rounded-full bg-gold px-5 text-sm font-semibold text-gold-fg"
          >
            Find my photos
          </Link>
        </div>
        <p className="mt-3 max-w-xl text-muted">
          Concerts, cookouts, BeltLine sunsets, Midtown after-hours. If you were in the room, you belong in the reel.
        </p>
      </div>
      <div className="mt-8 mask-x">
        <div className="reel-track flex w-max gap-3 px-5">
          {frames.map((frame, i) => (
            <figure key={`${frame.src}-${i}`} className="relative w-48 shrink-0 overflow-hidden rounded-md bg-elevated sm:w-56">
              <img src={frame.src} alt="" className="h-72 w-full object-cover sm:h-80" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-bg/75 px-3 py-3">
                <p className="font-hero text-xs tracking-[0.16em] text-gold">{frame.place}</p>
                <p className="text-sm text-fg">{frame.caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
