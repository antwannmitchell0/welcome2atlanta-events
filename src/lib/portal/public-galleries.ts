import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getEvent, getEventByCode, sampleEvents, type EventRecord } from "../events.ts";
import type { GalleryEventRow } from "./event-input.ts";
import { mediaUrl } from "./media-url.ts";
import type { GalleryPhotoRow } from "./photo-store.ts";

export type PublicGalleryPhoto = {
  id: string;
  featured: boolean;
  width: number | null;
  height: number | null;
  src: string;
};

export type PublicGallery = {
  kind: "sample" | "database";
  event: EventRecord;
  photos: PublicGalleryPhoto[];
};

export function toPublicEventRecord(row: GalleryEventRow): EventRecord {
  return {
    slug: row.slug,
    title: row.name,
    venue: row.venue || "Atlanta",
    neighborhood: row.neighborhood || "Atlanta",
    date: row.event_date,
    status: "live",
    description: row.description || "A Welcome to Atlanta Events gallery.",
    photoCount: row.photo_count,
    image: row.cover_photo_id ? mediaUrl(row.cover_photo_id) : "/events/welcome-atl.jpg",
    code: row.event_code,
  };
}

export function toPublicPhotos(rows: GalleryPhotoRow[]): PublicGalleryPhoto[] {
  return rows.map((row) => ({
    id: row.id,
    featured: row.featured,
    width: row.width,
    height: row.height,
    src: mediaUrl(row.id),
  }));
}

async function loadSql() {
  const { getSql } = await import("@/lib/db");
  return getSql();
}

export const listPublicGalleries = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { listPublishedEvents } = await import("./event-store.ts");
    const rows = await listPublishedEvents(await loadSql());
    const published = rows
      .filter((row) => !sampleEvents.some((sample) => sample.slug === row.slug || sample.code === row.event_code))
      .map(toPublicEventRecord);
    return { samples: sampleEvents, published };
  } catch {
    return { samples: sampleEvents, published: [] as EventRecord[] };
  }
});

export const getPublicGallery = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }): Promise<PublicGallery | null> => {
    const sample = getEvent(data.slug);
    if (sample) return { kind: "sample", event: sample, photos: [] };
    try {
      const { getPublishedEventBySlug } = await import("./event-store.ts");
      const { listPublicEventPhotos } = await import("./photo-store.ts");
      const sql = await loadSql();
      const row = await getPublishedEventBySlug(sql, data.slug);
      if (!row) return null;
      const photos = toPublicPhotos(await listPublicEventPhotos(sql, row.id));
      return { kind: "database", event: toPublicEventRecord({ ...row, photo_count: photos.length }), photos };
    } catch {
      return null;
    }
  });

export const lookupPublicGalleryByCode = createServerFn({ method: "GET" })
  .validator(z.object({ code: z.string().min(1).max(24) }))
  .handler(async ({ data }): Promise<PublicGallery | null> => {
    const sample = getEventByCode(data.code);
    if (sample) return { kind: "sample", event: sample, photos: [] };
    try {
      const { getPublishedEventByCode } = await import("./event-store.ts");
      const { listPublicEventPhotos } = await import("./photo-store.ts");
      const sql = await loadSql();
      const row = await getPublishedEventByCode(sql, data.code);
      if (!row) return null;
      const photos = toPublicPhotos(await listPublicEventPhotos(sql, row.id));
      return { kind: "database", event: toPublicEventRecord({ ...row, photo_count: photos.length }), photos };
    } catch {
      return null;
    }
  });
