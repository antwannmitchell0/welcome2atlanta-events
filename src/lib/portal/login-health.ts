/**
 * Owner-login readiness. Booleans only — never return emails, secrets, or URLs.
 * Env is passed in so this module stays safe to import from the login page.
 */

export type LoginHealth = {
  database: boolean;
  ownerEmailConfigured: boolean;
  ownerExists: boolean;
  authSecret: boolean;
  resendConfigured: boolean;
  canSignIn: boolean;
  canClaim: boolean;
};

function present(value: string | undefined | null): boolean {
  return Boolean(value?.trim());
}

export function loginHealthFromEnv(
  env: NodeJS.ProcessEnv,
  ownerExists: boolean,
): LoginHealth {
  const database = present(env.DATABASE_URL);
  const ownerEmailConfigured = present(env.WTAE_OWNER_EMAIL);
  const exists = database && ownerExists;
  return {
    database,
    ownerEmailConfigured,
    ownerExists: exists,
    authSecret: present(env.BETTER_AUTH_SECRET),
    resendConfigured: present(env.RESEND_API_KEY),
    canSignIn: exists,
    canClaim: database && ownerEmailConfigured && !exists,
  };
}

export function loginCopy(health: LoginHealth): {
  mode: "signin" | "claim" | "not-ready";
  detail: string;
} {
  if (health.canSignIn) {
    return {
      mode: "signin",
      detail: "Email and password. No public registration. Resend is not required to sign in.",
    };
  }
  if (health.canClaim) {
    return {
      mode: "claim",
      detail:
        "First sign-in creates the owner account. Use the email saved on the live site, and choose a password of at least 10 characters. Resend is not required.",
    };
  }
  if (!health.database) {
    return {
      mode: "not-ready",
      detail:
        "Owner login isn't ready yet. This is not an email or password problem, and it does not use Resend. The live site still needs its login database connected.",
    };
  }
  return {
    mode: "not-ready",
    detail:
      "Owner login isn't ready yet. Save the owner email on the live site, then return here. This is not Resend.",
  };
}
