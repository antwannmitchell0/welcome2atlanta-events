export function LiveBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-live">
      <span className="relative flex size-2">
        <span className="live-pulse absolute inset-0 rounded-full bg-live" />
        <span className="relative size-2 rounded-full bg-live" />
      </span>
      <span className={compact ? "font-hero text-xs" : "font-hero text-sm"}>{compact ? "LIVE" : "LIVE"}</span>
    </span>
  );
}
