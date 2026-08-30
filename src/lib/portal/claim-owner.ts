import { LOGIN_NOT_READY_MESSAGE } from "./guard.ts";

export const MIN_OWNER_PASSWORD = 10;

export function normalizeOwnerEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emailsMatch(a: string, b: string): boolean {
  return normalizeOwnerEmail(a) === normalizeOwnerEmail(b);
}

export function claimOwnerError(input: {
  databaseConfigured: boolean;
  configuredEmail: string | undefined;
  submittedEmail: string;
  password: string;
  ownerExists: boolean;
}): string | null {
  if (!input.databaseConfigured) return LOGIN_NOT_READY_MESSAGE;
  if (input.ownerExists) return "Owner login is already set up. Sign in instead.";
  if (!input.configuredEmail?.trim()) {
    return "Owner email is not saved on the live site yet.";
  }
  if (!emailsMatch(input.submittedEmail, input.configuredEmail)) {
    return "Use the owner email saved on the live site.";
  }
  if (input.password.length < MIN_OWNER_PASSWORD) {
    return `Password must be at least ${MIN_OWNER_PASSWORD} characters.`;
  }
  return null;
}
