import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { events } from "@/lib/events";
import type { AccessStatus, FounderState } from "@/lib/founder-auth";

const FOUNDER_FORBIDDEN = "Forbidden";

const eventStatus = z.enum(["new", "reviewing", "contacted", "approved", "declined", "completed"]);
const photoStatus = z.enum(["new", "reviewing", "interview", "approved", "declined"]);

const eventRequestInput = z.object({
  requester_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  event_name: z.string().trim().min(2).max(160),
  event_type: z.string().trim().max(80).optional().or(z.literal("")),
  event_date: z.string().trim().max(40).optional().or(z.literal("")),
  event_time: z.string().trim().max(40).optional().or(z.literal("")),
  venue_name: z.string().trim().max(160).optional().or(z.literal("")),
  venue_address: z.string().trim().max(240).optional().or(z.literal("")),
  expected_attendance: z.string().trim().max(40).optional().or(z.literal("")),
  website_or_event_link: z.string().trim().max(300).optional().or(z.literal("")),
  instagram: z.string().trim().max(80).optional().or(z.literal("")),
  coverage_requested: z.string().trim().max(240).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  website: z.string().max(0).optional().or(z.literal("")),
});

const photographerInput = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  instagram: z.string().trim().min(2).max(80),
  portfolio_url: z.string().trim().max(300).optional().or(z.literal("")),
  years_experience: z.string().trim().max(40).optional().or(z.literal("")),
  camera_equipment: z.string().trim().max(240).optional().or(z.literal("")),
  event_experience: z.string().trim().max(400).optional().or(z.literal("")),
  transportation: z.string().trim().max(80).optional().or(z.literal("")),
  availability: z.string().trim().max(80).optional().or(z.literal("")),
  why_wtae: z.string().trim().max(800).optional().or(z.literal("")),
  website: z.string().max(0).optional().or(z.literal("")),
});

function clean(value?: string | null) {
  const next = value?.trim() ?? "";
  return next.length ? next : null;
}

type Sql = Awaited<ReturnType<(typeof import("@/lib/db"))["getSql"]>>;

async function loadFounderState(sql: Sql): Promise<FounderState> {
  await sql`
    insert into founder_bootstrap (id, closed) values (1, false)
    on conflict (id) do nothing
  `;
  const founders = await sql<{ user_id: string }>`select user_id from founders`;
  const bootstrap = await sql<{ closed: boolean; claimed_user_id: string | null }>`
    select closed, claimed_user_id from founder_bootstrap where id = 1 limit 1
  `;
  return {
    founderUserIds: founders.map((row) => row.user_id),
    bootstrapClosed: Boolean(bootstrap[0]?.closed),
    claimedUserId: bootstrap[0]?.claimed_user_id ?? null,
  };
}

async function loadUserIdentity(sql: Sql, userId: string) {
  const rows = await sql<{ email: string; emailVerified: boolean }>`
    select email, "emailVerified" as "emailVerified" from "user" where id = ${userId} limit 1
  `;
  return {
    email: rows[0]?.email ?? null,
    emailVerified: Boolean(rows[0]?.emailVerified),
  };
}

async function persistFounderClaim(sql: Sql, userId: string) {
  const locked = await sql<{ claimed_user_id: string | null }>`
    update founder_bootstrap
    set closed = true, closed_at = now(), claimed_user_id = ${userId}
    where id = 1 and closed = false
    returning claimed_user_id
  `;
  if (locked.length === 0) {
    const existing = await sql<{ user_id: string }>`
      select user_id from founders where user_id = ${userId} limit 1
    `;
    if (existing.length === 0) throw new Error(FOUNDER_FORBIDDEN);
    return;
  }
  await sql`insert into founders (user_id) values (${userId}) on conflict (user_id) do nothing`;
}

async function requireFounder(userId: string) {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const existing = await sql<{ user_id: string }>`
    select user_id from founders where user_id = ${userId} limit 1
  `;
  if (existing.length === 0) {
    throw new Error(FOUNDER_FORBIDDEN);
  }
}

export const getFounderAccess = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ status: AccessStatus }> => {
    const { evaluateAccess, evaluateClaim, readFounderConfig } = await import("@/lib/founder-auth");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const state = await loadFounderState(sql);
    const config = readFounderConfig();
    const identity = await loadUserIdentity(sql, context.userId);
    const auto = evaluateClaim({
      userId: context.userId,
      email: identity.email,
      emailVerified: identity.emailVerified,
      providedSecret: "",
      config,
      state,
    });
    if (auto.ok && auto.reason === "email-allowlist") {
      await persistFounderClaim(sql, context.userId);
      return { status: "granted" };
    }
    if (auto.ok && auto.reason === "already-founder") {
      return { status: "granted" };
    }
    return { status: evaluateAccess({ userId: context.userId, config, state }).status };
  });

export const claimFounder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ secret: z.string().min(1).max(200) }))
  .handler(async ({ context, data }) => {
    const { evaluateClaim, readFounderConfig } = await import("@/lib/founder-auth");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const state = await loadFounderState(sql);
    const config = readFounderConfig();
    const identity = await loadUserIdentity(sql, context.userId);
    const decision = evaluateClaim({
      userId: context.userId,
      email: identity.email,
      emailVerified: identity.emailVerified,
      providedSecret: data.secret,
      config,
      state,
    });
    if (!decision.ok) throw new Error(FOUNDER_FORBIDDEN);
    if (decision.reason !== "already-founder") {
      await persistFounderClaim(sql, context.userId);
    }
    return { ok: true as const };
  });

export const submitEventRequest = createServerFn({ method: "POST" })
  .validator(eventRequestInput)
  .handler(async ({ data }) => {
    if (data.website) return { ok: true as const };
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const recent = await sql<{ count: number }>`
      select count(*)::int as count from event_requests
      where email = ${data.email} and created_at > now() - interval '10 minutes'
    `;
    if ((recent[0]?.count ?? 0) >= 3) {
      throw new Error("Too many requests from this email. Try again later.");
    }
    const rows = await sql<{ id: number }>`
      insert into event_requests (
        requester_name, email, phone, event_name, event_type, event_date, event_time,
        venue_name, venue_address, expected_attendance, website_or_event_link, instagram,
        coverage_requested, message
      ) values (
        ${data.requester_name}, ${data.email}, ${clean(data.phone)}, ${data.event_name},
        ${clean(data.event_type)}, ${clean(data.event_date)}, ${clean(data.event_time)},
        ${clean(data.venue_name)}, ${clean(data.venue_address)}, ${clean(data.expected_attendance)},
        ${clean(data.website_or_event_link)}, ${clean(data.instagram)},
        ${clean(data.coverage_requested)}, ${clean(data.message)}
      ) returning id
    `;
    return { ok: true as const, id: rows[0]?.id };
  });

export const submitPhotographerApplication = createServerFn({ method: "POST" })
  .validator(photographerInput)
  .handler(async ({ data }) => {
    if (data.website) return { ok: true as const };
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const recent = await sql<{ count: number }>`
      select count(*)::int as count from photographer_applications
      where email = ${data.email} and created_at > now() - interval '10 minutes'
    `;
    if ((recent[0]?.count ?? 0) >= 3) {
      throw new Error("Too many applications from this email. Try again later.");
    }
    const rows = await sql<{ id: number }>`
      insert into photographer_applications (
        full_name, email, phone, city, instagram, portfolio_url, years_experience,
        camera_equipment, event_experience, transportation, availability, why_wtae
      ) values (
        ${data.full_name}, ${data.email}, ${clean(data.phone)}, ${clean(data.city)},
        ${data.instagram}, ${clean(data.portfolio_url)}, ${clean(data.years_experience)},
        ${clean(data.camera_equipment)}, ${clean(data.event_experience)},
        ${clean(data.transportation)}, ${clean(data.availability)}, ${clean(data.why_wtae)}
      ) returning id
    `;
    return { ok: true as const, id: rows[0]?.id };
  });

export const getPortalOverview = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireFounder(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const requests = await sql<{ status: string; count: number }>`
      select status, count(*)::int as count from event_requests group by status
    `;
    const photos = await sql<{ status: string; count: number }>`
      select status, count(*)::int as count from photographer_applications group by status
    `;
    const countBy = (rows: { status: string; count: number }[], status: string) =>
      rows.find((row) => row.status === status)?.count ?? 0;
    const requestTotal = requests.reduce((sum, row) => sum + row.count, 0);
    const photoTotal = photos.reduce((sum, row) => sum + row.count, 0);
    return {
      events: {
        total: events.length,
        live: events.filter((event) => event.status === "live").length,
        upcoming: events.filter((event) => event.status === "upcoming").length,
        past: events.filter((event) => event.status === "past").length,
      },
      requests: {
        total: requestTotal,
        new: countBy(requests, "new"),
        reviewing: countBy(requests, "reviewing"),
        approved: countBy(requests, "approved"),
      },
      photographers: {
        total: photoTotal,
        new: countBy(photos, "new"),
        reviewing: countBy(photos, "reviewing"),
        approved: countBy(photos, "approved"),
      },
    };
  });

export const getPortalEventCatalog = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireFounder(context.userId);
    return events;
  });

export const listEventRequests = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireFounder(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    return sql<EventRequestRow>`
      select id, requester_name, email, phone, event_name, event_type, event_date, event_time,
        venue_name, venue_address, expected_attendance, website_or_event_link, instagram,
        coverage_requested, message, status, founder_notes, created_at, updated_at
      from event_requests order by created_at desc
    `;
  });

export const getEventRequest = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ context, data }) => {
    await requireFounder(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<EventRequestRow>`
      select id, requester_name, email, phone, event_name, event_type, event_date, event_time,
        venue_name, venue_address, expected_attendance, website_or_event_link, instagram,
        coverage_requested, message, status, founder_notes, created_at, updated_at
      from event_requests where id = ${data.id} limit 1
    `;
    return rows[0] ?? null;
  });

export const updateEventRequest = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number(), status: eventStatus, founder_notes: z.string().max(4000) }))
  .handler(async ({ context, data }) => {
    await requireFounder(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      update event_requests
      set status = ${data.status}, founder_notes = ${data.founder_notes}, updated_at = now()
      where id = ${data.id}
    `;
    return { ok: true as const };
  });

export const listPhotographerApplications = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireFounder(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    return sql<PhotographerRow>`
      select id, full_name, email, phone, city, instagram, portfolio_url, years_experience,
        camera_equipment, event_experience, transportation, availability, why_wtae, status,
        founder_notes, created_at, updated_at
      from photographer_applications order by created_at desc
    `;
  });

export const getPhotographerApplication = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ context, data }) => {
    await requireFounder(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<PhotographerRow>`
      select id, full_name, email, phone, city, instagram, portfolio_url, years_experience,
        camera_equipment, event_experience, transportation, availability, why_wtae, status,
        founder_notes, created_at, updated_at
      from photographer_applications where id = ${data.id} limit 1
    `;
    return rows[0] ?? null;
  });

export const updatePhotographerApplication = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number(), status: photoStatus, founder_notes: z.string().max(4000) }))
  .handler(async ({ context, data }) => {
    await requireFounder(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      update photographer_applications
      set status = ${data.status}, founder_notes = ${data.founder_notes}, updated_at = now()
      where id = ${data.id}
    `;
    return { ok: true as const };
  });

export type EventRequestRow = {
  id: number;
  requester_name: string;
  email: string;
  phone: string | null;
  event_name: string;
  event_type: string | null;
  event_date: string | null;
  event_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  expected_attendance: string | null;
  website_or_event_link: string | null;
  instagram: string | null;
  coverage_requested: string | null;
  message: string | null;
  status: z.infer<typeof eventStatus>;
  founder_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PhotographerRow = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  instagram: string;
  portfolio_url: string | null;
  years_experience: string | null;
  camera_equipment: string | null;
  event_experience: string | null;
  transportation: string | null;
  availability: string | null;
  why_wtae: string | null;
  status: z.infer<typeof photoStatus>;
  founder_notes: string | null;
  created_at: string;
  updated_at: string;
};
