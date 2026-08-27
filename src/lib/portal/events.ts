import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sampleEvents } from "../events.ts";
import { eventInputSchema } from "./event-input.ts";
import {
  createOwnerEvent,
  getOwnerEvent,
  listOwnerEvents as listStoredEvents,
  setOwnerEventStatus,
  updateOwnerEvent,
} from "./event-store.ts";
import { getPortalMe } from "./me.ts";
import {
  deleteEventPhoto,
  listEventPhotos,
  reorderEventPhotos,
  setPhotoCover,
  setPhotoFlags,
} from "./photo-store.ts";
import { assertOwner } from "./session.ts";

async function requireOwner() {
  return assertOwner(await getPortalMe());
}

async function sql() {
  const { getSql } = await import("@/lib/db");
  return getSql();
}

export const listOwnerEvents = createServerFn({ method: "GET" }).handler(async () => {
  await requireOwner();
  return { events: await listStoredEvents(await sql()), sampleCount: sampleEvents.length };
});

export const getGalleryEvent = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireOwner();
    const db = await sql();
    const event = await getOwnerEvent(db, data.id);
    if (!event) throw new Error("Event not found.");
    const photos = await listEventPhotos(db, data.id);
    return { event, photos };
  });

export const createGalleryEvent = createServerFn({ method: "POST" })
  .validator(eventInputSchema)
  .handler(async ({ data }) => {
    const actor = await requireOwner();
    return createOwnerEvent(await sql(), actor, data);
  });

export const updateGalleryEvent = createServerFn({ method: "POST" })
  .validator(eventInputSchema.extend({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireOwner();
    const { id, ...input } = data;
    return updateOwnerEvent(await sql(), id, input);
  });

export const setEventStatus = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1), status: z.enum(["draft", "published", "archived"]) }))
  .handler(async ({ data }) => {
    await requireOwner();
    return setOwnerEventStatus(await sql(), data.id, data.status);
  });

export const setCoverPhoto = createServerFn({ method: "POST" })
  .validator(z.object({ eventId: z.string().min(1), photoId: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireOwner();
    return setPhotoCover(await sql(), data.eventId, data.photoId);
  });

export const setGalleryPhotoFlags = createServerFn({ method: "POST" })
  .validator(
    z.object({
      photoId: z.string().min(1),
      featured: z.boolean().optional(),
      hidden: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireOwner();
    return setPhotoFlags(await sql(), data.photoId, { featured: data.featured, hidden: data.hidden });
  });

export const reorderGalleryPhotos = createServerFn({ method: "POST" })
  .validator(z.object({ eventId: z.string().min(1), photoIds: z.array(z.string().min(1)).min(1) }))
  .handler(async ({ data }) => {
    await requireOwner();
    return reorderEventPhotos(await sql(), data.eventId, data.photoIds);
  });

export const deleteGalleryPhoto = createServerFn({ method: "POST" })
  .validator(z.object({ eventId: z.string().min(1), photoId: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireOwner();
    const { deletePrivateBlob } = await import("./blob-io.ts");
    return deleteEventPhoto(await sql(), data.eventId, data.photoId, deletePrivateBlob);
  });
