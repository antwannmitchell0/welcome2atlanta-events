import { randomUUID } from "node:crypto";
import { sampleEvents } from "../events.ts";
import { canPublishEvent, isPublicGalleryEvent, type PortalActor } from "./authz.ts";
import { generateEventCode, isValidEventCode, normalizeEventCode, slugify } from "./codes.ts";
import type { EventInput, GalleryEventRow, GalleryEventStatus } from "./event-input.ts";

export type SqlLike = {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
};

const EVENT_SELECT = `select e.*,
  (select count(*) from gallery_photo p where p.event_id = e.id and p.upload_status = 'ready') as photo_count,
  (select count(*) from gallery_photo p where p.event_id = e.id and p.upload_status = 'failed') as failed_count
 from gallery_event e`;

export function reservedSampleSlugs(): Set<string> {
  return new Set(sampleEvents.map((event) => event.slug));
}

export function reservedSampleCodes(): Set<string> {
  return new Set(sampleEvents.map((event) => normalizeEventCode(event.code)));
}

export function mapEvent(
  row: Omit<GalleryEventRow, "photo_count" | "failed_count"> & {
    photo_count?: number | string;
    failed_count?: number | string;
  },
): GalleryEventRow {
  return {
    ...row,
    photo_count: Number(row.photo_count ?? 0),
    failed_count: Number(row.failed_count ?? 0),
  };
}

function uniqueViolation(err: unknown): boolean {
  return Boolean(err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505");
}

export async function allocateSlug(sql: SqlLike, name: string, requested: string | undefined, exceptId?: string) {
  const slug = slugify(requested || name);
  if (reservedSampleSlugs().has(slug)) throw new Error("That slug is already in use.");
  const taken = exceptId
    ? await sql.query(`select 1 from gallery_event where slug = $1 and id <> $2`, [slug, exceptId])
    : await sql.query(`select 1 from gallery_event where slug = $1`, [slug]);
  if (taken[0]) throw new Error("That slug is already in use.");
  return slug;
}

export async function allocateEventCode(
  sql: SqlLike,
  name: string,
  requested: string | undefined,
  exceptId?: string,
) {
  const reserved = reservedSampleCodes();
  const takenRows = exceptId
    ? await sql.query<{ event_code: string }>(`select event_code from gallery_event where id <> $1`, [exceptId])
    : await sql.query<{ event_code: string }>(`select event_code from gallery_event`);
  const taken = new Set(takenRows.map((row) => row.event_code));
  try {
    const booked = await sql.query<{ event_code: string }>(`select event_code from coverage_request`);
    for (const row of booked) taken.add(row.event_code);
  } catch {
    // coverage_request lands in 0004; ignore if a stale schema is in play
  }

  if (requested && requested.trim()) {
    const code = normalizeEventCode(requested);
    if (!isValidEventCode(code)) throw new Error("Event code is invalid.");
    if (reserved.has(code) || taken.has(code)) throw new Error("That event code is already in use.");
    return code;
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateEventCode(name);
    if (isValidEventCode(code) && !reserved.has(code) && !taken.has(code)) return code;
  }
  throw new Error("Could not allocate a unique event code.");
}

export async function listOwnerEvents(sql: SqlLike): Promise<GalleryEventRow[]> {
  const rows = await sql.query<Parameters<typeof mapEvent>[0]>(`${EVENT_SELECT} order by e.updated_at desc`);
  return rows.map(mapEvent);
}

export async function getOwnerEvent(sql: SqlLike, id: string): Promise<GalleryEventRow | null> {
  const rows = await sql.query<Parameters<typeof mapEvent>[0]>(`${EVENT_SELECT} where e.id = $1`, [id]);
  return rows[0] ? mapEvent(rows[0]) : null;
}

export async function listPublishedEvents(sql: SqlLike): Promise<GalleryEventRow[]> {
  const rows = await sql.query<Parameters<typeof mapEvent>[0]>(
    `${EVENT_SELECT} where e.status = 'published' order by e.event_date desc`,
  );
  return rows.filter((row) => isPublicGalleryEvent(row.status)).map(mapEvent);
}

export async function createOwnerEvent(sql: SqlLike, actor: PortalActor, data: EventInput) {
  const slug = await allocateSlug(sql, data.name, data.slug);
  const eventCode = await allocateEventCode(sql, data.name, data.eventCode);
  const id = randomUUID();
  try {
    await sql.query(
      `insert into gallery_event
        (id, name, slug, event_code, event_date, start_time, venue, neighborhood, description, status, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft',$10)`,
      [
        id,
        data.name,
        slug,
        eventCode,
        data.eventDate,
        data.startTime || null,
        data.venue || "",
        data.neighborhood || "",
        data.description || "",
        actor.userId,
      ],
    );
  } catch (err) {
    if (uniqueViolation(err)) throw new Error("That slug or event code is already in use.");
    throw err;
  }
  return { id, slug, eventCode, status: "draft" as const };
}

export async function updateOwnerEvent(sql: SqlLike, id: string, data: EventInput) {
  const current = await sql.query<{ slug: string; event_code: string }>(
    `select slug, event_code from gallery_event where id = $1`,
    [id],
  );
  if (!current[0]) throw new Error("Event not found.");
  const slug = await allocateSlug(sql, data.name, data.slug || current[0].slug, id);
  const eventCode = data.eventCode
    ? await allocateEventCode(sql, data.name, data.eventCode, id)
    : current[0].event_code;
  try {
    await sql.query(
      `update gallery_event
       set name=$2, slug=$3, event_code=$4, event_date=$5, start_time=$6,
           venue=$7, neighborhood=$8, description=$9, updated_at=now()
       where id=$1`,
      [
        id,
        data.name,
        slug,
        eventCode,
        data.eventDate,
        data.startTime || null,
        data.venue || "",
        data.neighborhood || "",
        data.description || "",
      ],
    );
  } catch (err) {
    if (uniqueViolation(err)) throw new Error("That slug or event code is already in use.");
    throw err;
  }
  return { ok: true as const, slug, eventCode };
}

export async function setOwnerEventStatus(sql: SqlLike, id: string, status: GalleryEventStatus) {
  const rows = await sql.query<{ name: string; slug: string; event_code: string; status: string }>(
    `select name, slug, event_code, status from gallery_event where id = $1`,
    [id],
  );
  if (!rows[0]) throw new Error("Event not found.");
  if (status === "published") {
    const ready = await sql.query<{ count: number | string }>(
      `select count(*) as count from gallery_photo
       where event_id = $1 and upload_status = 'ready' and hidden = false`,
      [id],
    );
    const problem = canPublishEvent({
      name: rows[0].name,
      slug: rows[0].slug,
      eventCode: rows[0].event_code,
      readyPhotoCount: Number(ready[0]?.count ?? 0),
    });
    if (problem) throw new Error(problem);
  }
  await sql.query(
    `update gallery_event
     set status = $2,
         archived_at = case when $2 = 'archived' then now() else null end,
         updated_at = now()
     where id = $1`,
    [id, status],
  );
  return { ok: true as const, status };
}

export async function getPublishedEventBySlug(sql: SqlLike, slug: string): Promise<GalleryEventRow | null> {
  const rows = await sql.query<Parameters<typeof mapEvent>[0]>(
    `${EVENT_SELECT} where e.slug = $1 and e.status = 'published'`,
    [slug],
  );
  return rows[0] ? mapEvent(rows[0]) : null;
}

export async function getPublishedEventByCode(sql: SqlLike, code: string): Promise<GalleryEventRow | null> {
  const normalized = normalizeEventCode(code);
  if (!normalized) return null;
  const rows = await sql.query<Parameters<typeof mapEvent>[0]>(
    `${EVENT_SELECT} where e.event_code = $1 and e.status = 'published'`,
    [normalized],
  );
  return rows[0] ? mapEvent(rows[0]) : null;
}

export async function getOwnerEventByCode(sql: SqlLike, code: string): Promise<GalleryEventRow | null> {
  const normalized = normalizeEventCode(code);
  if (!normalized) return null;
  const rows = await sql.query<Parameters<typeof mapEvent>[0]>(
    `${EVENT_SELECT} where e.event_code = $1`,
    [normalized],
  );
  return rows[0] ? mapEvent(rows[0]) : null;
}

