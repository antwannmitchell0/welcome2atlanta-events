export function neighborhoodWatermark(neighborhood: string): string {
  const place = neighborhood.trim() || "Atlanta";
  return `${place} · WTAE`;
}
