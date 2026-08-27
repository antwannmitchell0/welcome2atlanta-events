export type PortalRole = "owner" | "photographer";
export type AccountStatus = "active" | "invited" | "disabled";

export type PortalActor = {
  userId: string;
  email: string | null;
  role: PortalRole;
  status: AccountStatus;
  displayName: string;
};

export function canManageAllEvents(actor: PortalActor): boolean {
  return actor.role === "owner" && actor.status === "active";
}

export function canUploadToEvent(
  actor: PortalActor,
  assignedEventIds: string[],
  eventId: string,
): boolean {
  if (actor.status !== "active") return false;
  if (actor.role === "owner") return true;
  return actor.role === "photographer" && assignedEventIds.includes(eventId);
}

export function canPublish(actor: PortalActor): boolean {
  return canManageAllEvents(actor);
}

export function publicPhotoVisible(input: {
  eventStatus: string;
  uploadStatus: string;
  hidden: boolean;
}): boolean {
  return input.eventStatus === "published" && input.uploadStatus === "ready" && input.hidden === false;
}

export function canPublishEvent(input: {
  name: string;
  slug: string;
  eventCode: string;
  readyPhotoCount: number;
}): string | null {
  if (!input.name.trim()) return "Event name is required.";
  if (!input.slug.trim()) return "Event slug is required.";
  if (!input.eventCode.trim()) return "Event code is required.";
  if (input.readyPhotoCount < 1) return "Publish requires at least one ready photo.";
  return null;
}
