export const SKU_IDS = ["room", "night", "block"] as const;
export type SkuId = (typeof SKU_IDS)[number];

export type OrganizerSku = {
  id: SkuId;
  name: string;
  priceLabel: string;
  priceCents: number;
  summary: string;
};

export const organizerSkus: OrganizerSku[] = [
  {
    id: "room",
    name: "ROOM",
    priceLabel: "$450",
    priceCents: 45000,
    summary: "1 photographer, 3 hours, gallery by next noon, QR + code, 15-frame share pack",
  },
  {
    id: "night",
    name: "NIGHT",
    priceLabel: "$900",
    priceCents: 90000,
    summary: "2 shooters or 5 hours, 8-frame teaser by 1am, full gallery noon, organizer recap, 9:16 reel",
  },
  {
    id: "block",
    name: "BLOCK",
    priceLabel: "$2400 / 4 dates",
    priceCents: 240000,
    summary: "season pass, priority routing, branded code, monthly neighborhood feature",
  },
];

export const GUEST_PHOTOS_LINE = "Guest photos stay free.";

export function getSku(id: string): OrganizerSku | undefined {
  return organizerSkus.find((sku) => sku.id === id);
}

export function isSkuId(value: string): value is SkuId {
  return (SKU_IDS as readonly string[]).includes(value);
}
