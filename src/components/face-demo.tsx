import { reelFrames } from "@/lib/reel";

export function FaceDemoSlot() {
  return (
    <aside className="mt-6 overflow-hidden rounded-xl border border-border bg-elevated">
      <div className="relative aspect-[16/9]">
        {reelFrames.map((frame, index) => (
          <img
            key={frame.src}
            src={frame.src}
            alt=""
            className="face-demo-frame absolute inset-0 h-full w-full object-cover"
            style={{ animationDelay: `${-index}s` }}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/90 to-transparent px-4 pb-3 pt-10">
          <p className="text-sm text-fg">If you were in the room, you belong in the reel.</p>
          <p className="mt-1 text-[10px] tracking-[0.16em] text-accent">SILENT DEMO · 8 SECONDS</p>
        </div>
      </div>
    </aside>
  );
}
