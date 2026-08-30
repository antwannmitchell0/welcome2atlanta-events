import { z } from "zod";

export const eventInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().max(80).optional(),
  eventCode: z.string().trim().max(24).optional(),
  eventDate: z.string().trim().min(1).max(40),
  startTime: z.string().trim().max(40).optional().or(z.literal("")),
  venue: z.string().trim().max(160).optional().or(z.literal("")),
  neighborhood: z.string().trim().max(80).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type EventInput = z.infer<typeof eventInputSchema>;

export type GalleryEventStatus = "draft" | "published" | "archived";

export type GalleryEventRow = {
  id: string;
  name: string;
  slug: string;
  event_code: string;
  event_date: string;
  start_time: string | null;
  venue: string;
  neighborhood: string;
  description: string;
  status: GalleryEventStatus;
  cover_photo_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  photo_count: number;
  failed_count: number;
};

export function parseEventInput(raw: unknown): { ok: true; data: EventInput } | { ok: false; error: string } {
  const parsed = eventInputSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Invalid event details." };
  }
  return { ok: true, data: parsed.data };
}
