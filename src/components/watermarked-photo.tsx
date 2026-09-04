import { neighborhoodWatermark } from "@/lib/watermark";

export function WatermarkedPhoto({
  src,
  neighborhood,
  alt = "",
  className = "aspect-[4/5] w-full object-cover",
}: {
  src: string;
  neighborhood: string;
  alt?: string;
  className?: string;
}) {
  return (
    <div className="relative overflow-hidden bg-elevated">
      <img src={src} alt={alt} className={className} />
      <span className="pointer-events-none absolute bottom-2 left-2 right-2 text-[10px] font-medium tracking-[0.14em] text-fg drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        {neighborhoodWatermark(neighborhood)}
      </span>
    </div>
  );
}
