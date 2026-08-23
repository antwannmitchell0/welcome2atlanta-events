export const FOUNDER_FORBIDDEN = "Forbidden";
export const MIN_CLAIM_SECRET_LENGTH = 24;

export type FounderConfig = {
  claimSecret: string | null;
  allowedEmails: string[];
};

export type FounderState = {
  founderUserIds: string[];
  bootstrapClosed: boolean;
  claimedUserId: string | null;
};

export type AccessStatus = "granted" | "claim-required" | "denied";

export type AccessDecision = {
  status: AccessStatus;
  reason: "unauthenticated" | "founder" | "claim-open" | "denied";
};

export type ClaimDecision =
  | { ok: true; reason: "already-founder" | "email-allowlist" | "claim-secret" }
  | {
      ok: false;
      reason:
        | "unauthenticated"
        | "bootstrap-closed"
        | "invalid-secret"
        | "not-authorized"
        | "bootstrap-unconfigured";
    };

export function parseFounderEmails(raw: string | undefined | null): string[] {
  if (!raw) return [];
  const emails = new Set<string>();
  for (const part of raw.split(/[,\n]/)) {
    const email = part.trim().toLowerCase();
    if (email.includes("@") && email.includes(".")) emails.add(email);
  }
  return [...emails];
}

export function readFounderConfig(
  env: Record<string, string | undefined> = process.env,
): FounderConfig {
  const claimSecret = env.WTAE_FOUNDER_CLAIM_SECRET?.trim() || null;
  const allowedEmails = parseFounderEmails(
    [env.WTAE_FOUNDER_EMAILS, env.WTAE_FOUNDER_EMAIL].filter(Boolean).join(","),
  );
  return { claimSecret, allowedEmails };
}

export function isClaimSecretConfigured(secret: string | null | undefined): secret is string {
  return typeof secret === "string" && secret.length >= MIN_CLAIM_SECRET_LENGTH;
}

export function secretsMatch(
  provided: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (!isClaimSecretConfigured(expected) || typeof provided !== "string") return false;
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < provided.length; i += 1) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export function evaluateAccess(input: {
  userId?: string | null;
  config: FounderConfig;
  state: FounderState;
}): AccessDecision {
  if (!input.userId) return { status: "denied", reason: "unauthenticated" };
  if (input.state.founderUserIds.includes(input.userId)) {
    return { status: "granted", reason: "founder" };
  }
  if (!input.state.bootstrapClosed && isClaimSecretConfigured(input.config.claimSecret)) {
    return { status: "claim-required", reason: "claim-open" };
  }
  return { status: "denied", reason: "denied" };
}

export function evaluateClaim(input: {
  userId?: string | null;
  email?: string | null;
  emailVerified?: boolean | null;
  providedSecret?: string | null;
  config: FounderConfig;
  state: FounderState;
}): ClaimDecision {
  if (!input.userId) return { ok: false, reason: "unauthenticated" };
  if (input.state.founderUserIds.includes(input.userId)) {
    return { ok: true, reason: "already-founder" };
  }
  if (input.state.bootstrapClosed) return { ok: false, reason: "bootstrap-closed" };

  const email = input.email?.trim().toLowerCase() ?? "";
  // Allowlist is only honored for a verified identity. Open email/password
  // sign-up must not let a stranger register as the founder address.
  if (email && input.emailVerified === true && input.config.allowedEmails.includes(email)) {
    return { ok: true, reason: "email-allowlist" };
  }

  const configured =
    isClaimSecretConfigured(input.config.claimSecret) || input.config.allowedEmails.length > 0;
  if (!configured) return { ok: false, reason: "bootstrap-unconfigured" };

  if (secretsMatch(input.providedSecret, input.config.claimSecret)) {
    return { ok: true, reason: "claim-secret" };
  }
  if (input.providedSecret) return { ok: false, reason: "invalid-secret" };
  return { ok: false, reason: "not-authorized" };
}

export const PORTAL_PROTECTED_FNS = [
  "getPortalOverview",
  "getPortalEventCatalog",
  "listEventRequests",
  "getEventRequest",
  "updateEventRequest",
  "listPhotographerApplications",
  "getPhotographerApplication",
  "updatePhotographerApplication",
] as const;
