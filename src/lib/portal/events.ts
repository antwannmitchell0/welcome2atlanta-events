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
    const event = await getOwnerEvent(await sql(), data.id);
    if (!event) throw new Error("Event not found.");
    return { event };
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
