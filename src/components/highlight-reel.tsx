import { Link } from "@tanstack/react-router";
import { ScanFace } from "lucide-react";
import { reelFrames } from "@/lib/reel";

export function HighlightReel() {
  const frames = [...reelFrames, ...reelFrames];

  return (
    <section className="overflow-hidden border-y border-border bg-bg py-14">
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-xs tracking-[0.22em] text-accent">THE HIGHLIGHT REEL</p>
        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-xl font-display text-3xl text-fg md:text-4xl">
            See yourself in The A.
          </h2>
          <Link
            to="/photos/face"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-fg"
          >
            <ScanFace className="size-4" />
            Scan to find you
          </Link>
        </div>
        <p className="mt-3 max-w-xl text-muted">
          Concerts, cookouts, BeltLine sunsets, Midtown after-hours. If you were in the room, you belong in the reel.
        </p>
      </div>

      <div className="mt-8 mask-x">
        <div className="reel-track flex w-max gap-3 px-5">
          {frames.map((frame, i) => (
            <figure
              key={`${frame.src}-${i}`}
              className="relative w-48 shrink-0 overflow-hidden rounded-lg bg-elevated sm:w-56"
            >
              <img src={frame.src} alt="" className="h-72 w-full object-cover sm:h-80" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-bg/70 px-3 py-3">
                <p className="text-[10px] tracking-[0.16em] text-accent">{frame.place}</p>
                <p className="text-sm text-fg">{frame.caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
