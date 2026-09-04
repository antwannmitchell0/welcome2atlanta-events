import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { vercelWithoutDatabase } from "@/lib/db";
import { getSku } from "../skus.ts";
import { photosPathForCode, photosUrlForCode, printPathForCode } from "../site.ts";
import { getPortalMe } from "./me.ts";
import { assertOwner } from "./session.ts";
import {
  createCoverageRequest,
  getCoverageByCode,
  listCoverageRequests,
  type CoverageRequestRow,
} from "./coverage-store.ts";

const bookingSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().min(3).max(200),
  phone: z.string().min(1).max(40),
  date: z.string().min(1).max(32),
  neighborhood: z.string().min(1).max(80),
  sku: z.string().min(1).max(16),
  venue: z.string().min(1).max(160),
  notes: z.string().max(2000).optional().default(""),
});

async function sql() {
  const { getSql } = await import("@/lib/db");
  return getSql();
}

export type BookingSuccess = {
  code: string;
  galleryPath: string;
  galleryUrl: string;
  printPath: string;
  skuName: string;
  skuPrice: string;
  neighborhood: string;
  venue: string;
  date: string;
};

function toSuccess(row: CoverageRequestRow): BookingSuccess {
  const sku = getSku(row.sku);
  return {
    code: row.event_code,
    galleryPath: photosPathForCode(row.event_code),
    galleryUrl: photosUrlForCode(row.event_code),
    printPath: printPathForCode(row.event_code),
    skuName: sku?.name ?? row.sku.toUpperCase(),
    skuPrice: sku?.priceLabel ?? "",
    neighborhood: row.neighborhood,
    venue: row.venue,
    date: row.event_date,
  };
}

export const submitCoverageRequest = createServerFn({ method: "POST" })
  .validator(bookingSchema)
  .handler(async ({ data }): Promise<BookingSuccess> => {
    if (vercelWithoutDatabase()) {
      throw new Error("Booking is temporarily unavailable. Database is not connected.");
    }
    const row = await createCoverageRequest(await sql(), {
      name: data.name,
      email: data.email,
      phone: data.phone,
      date: data.date,
      neighborhood: data.neighborhood,
      sku: data.sku,
      venue: data.venue,
      notes: data.notes ?? "",
    });
    return toSuccess(row);
  });

export const listOwnerCoverageRequests = createServerFn({ method: "GET" }).handler(async () => {
  await assertOwner(await getPortalMe());
  if (vercelWithoutDatabase()) return { requests: [] as CoverageRequestRow[] };
  return { requests: await listCoverageRequests(await sql()) };
});

export const getPrintCard = createServerFn({ method: "GET" })
  .validator(z.object({ code: z.string().min(1).max(24) }))
  .handler(async ({ data }) => {
    const { getEventByCode } = await import("../events.ts");
    const sample = getEventByCode(data.code);
    if (sample) {
      return {
        code: sample.code,
        name: sample.title,
        neighborhood: sample.neighborhood,
        venue: sample.venue,
        galleryUrl: photosUrlForCode(sample.code),
      };
    }
    try {
      const db = await sql();
      const request = await getCoverageByCode(db, data.code);
      if (request) {
        return {
          code: request.event_code,
          name: request.venue,
          neighborhood: request.neighborhood,
          venue: request.venue,
          galleryUrl: photosUrlForCode(request.event_code),
        };
      }
      const { getOwnerEventByCode } = await import("./event-store.ts");
      const event = await getOwnerEventByCode(db, data.code).catch(() => null);
      if (event) {
        return {
          code: event.event_code,
          name: event.name,
          neighborhood: event.neighborhood || "Atlanta",
          venue: event.venue,
          galleryUrl: photosUrlForCode(event.event_code),
        };
      }
    } catch {
      return null;
    }
    return null;
  });
