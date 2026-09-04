import { randomUUID } from "node:crypto";
import { sampleEvents } from "../events.ts";
import { isSkuId, type SkuId } from "../skus.ts";
import { isBookingNeighborhood } from "../reel.ts";
import {
  generateGuestCode,
  isGuestEventCode,
  isValidEventCode,
  normalizeEventCode,
  RESERVED_DEMO_CODES,
} from "./codes.ts";

export type SqlLike = {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
};

export type CoverageStatus = "open" | "booked" | "declined" | "archived";

export type CoverageRequestRow = {
  id: string;
  organizer_name: string;
  organizer_email: string;
  organizer_phone: string;
  event_date: string;
  neighborhood: string;
  sku: SkuId;
  venue: string;
  notes: string;
  event_code: string;
  status: CoverageStatus;
  parent_request_id: string | null;
  created_at: string;
};

export type CoverageInput = {
  name: string;
  email: string;
  phone: string;
  date: string;
  neighborhood: string;
  sku: string;
  venue: string;
  notes: string;
};

export function reservedCodes(): Set<string> {
  const codes = new Set<string>(RESERVED_DEMO_CODES);
  for (const event of sampleEvents) codes.add(normalizeEventCode(event.code));
  return codes;
}

function uniqueViolation(err: unknown): boolean {
  return Boolean(err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505");
}

export function parseCoverageInput(raw: CoverageInput): Omit<CoverageInput, "sku"> & { sku: SkuId } {
  const name = raw.name.trim();
  const email = raw.email.trim().toLowerCase();
  const phone = raw.phone.trim();
  const date = raw.date.trim();
  const neighborhood = raw.neighborhood.trim();
  const venue = raw.venue.trim();
  const notes = raw.notes.trim();
  const sku = raw.sku.trim().toLowerCase();
  if (name.length < 2) throw new Error("Name is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("A valid email is required.");
  if (phone.length < 7) throw new Error("Phone is required.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Pick a coverage date.");
  if (!isBookingNeighborhood(neighborhood)) throw new Error("Pick a neighborhood from the list.");
  if (!isSkuId(sku)) throw new Error("Pick ROOM, NIGHT, or BLOCK.");
  if (venue.length < 2) throw new Error("Venue / room name is required.");
  if (notes.length > 2000) throw new Error("Notes are too long.");
  return { name, email, phone, date, neighborhood, sku, venue, notes };
}

export async function takenCodes(sql: SqlLike): Promise<Set<string>> {
  const taken = reservedCodes();
  const events = await sql.query<{ event_code: string }>(`select event_code from gallery_event`);
  for (const row of events) taken.add(normalizeEventCode(row.event_code));
  try {
    const requests = await sql.query<{ event_code: string }>(`select event_code from coverage_request`);
    for (const row of requests) taken.add(normalizeEventCode(row.event_code));
  } catch {
    // table may not exist yet on a stale connection
  }
  return taken;
}

export async function mintGuestCode(sql: SqlLike): Promise<string> {
  const taken = await takenCodes(sql);
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const length: 4 | 5 | 6 = attempt < 20 ? 4 : attempt < 28 ? 5 : 6;
    const code = generateGuestCode(length);
    if (!isValidEventCode(code) || !isGuestEventCode(code)) continue;
    if (taken.has(code)) continue;
    return code;
  }
  throw new Error("Could not allocate a unique event code.");
}

export function mapCoverage(row: CoverageRequestRow): CoverageRequestRow {
  return row;
}

export async function createCoverageRequest(sql: SqlLike, raw: CoverageInput): Promise<CoverageRequestRow> {
  const input = parseCoverageInput(raw);
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const id = randomUUID();
    const eventCode = await mintGuestCode(sql);
    try {
      const rows = await sql.query<CoverageRequestRow>(
        `insert into coverage_request
          (id, organizer_name, organizer_email, organizer_phone, event_date, neighborhood, sku, venue, notes, event_code, status)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'open')
         returning *`,
        [
          id,
          input.name,
          input.email,
          input.phone,
          input.date,
          input.neighborhood,
          input.sku,
          input.venue,
          input.notes,
          eventCode,
        ],
      );
      const row = rows[0];
      if (!row) throw new Error("Could not save that request.");
      return mapCoverage(row);
    } catch (err) {
      if (uniqueViolation(err) && attempt < 5) continue;
      throw err;
    }
  }
  throw new Error("Could not allocate a unique event code.");
}

export async function listCoverageRequests(sql: SqlLike): Promise<CoverageRequestRow[]> {
  const rows = await sql.query<CoverageRequestRow>(
    `select * from coverage_request order by created_at desc`,
  );
  return rows.map(mapCoverage);
}

export async function getCoverageByCode(sql: SqlLike, raw: string): Promise<CoverageRequestRow | null> {
  const code = normalizeEventCode(raw);
  if (!code) return null;
  const rows = await sql.query<CoverageRequestRow>(
    `select * from coverage_request where event_code = $1`,
    [code],
  );
  return rows[0] ? mapCoverage(rows[0]) : null;
}
