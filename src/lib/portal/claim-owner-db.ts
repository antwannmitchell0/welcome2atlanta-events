import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { Client } from "pg";
import { claimOwnerError, normalizeOwnerEmail } from "./claim-owner.ts";

void process.env.DATABASE_URL;
void process.env.WTAE_OWNER_EMAIL;

export type ClaimOwnerResult = { ok: true } | { ok: false; error: string };

async function ownerRowExists(client: Client): Promise<boolean> {
  const existing = await client.query(
    `select user_id from user_profile where role = 'owner' order by created_at asc limit 1`,
  );
  return Boolean(existing.rows[0]);
}

export async function countOwners(): Promise<number> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return 0;
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const rows = await client.query<{ n: string }>(
      `select count(*)::text as n from user_profile where role = 'owner'`,
    );
    return Number(rows.rows[0]?.n ?? 0);
  } catch {
    return 0;
  } finally {
    await client.end();
  }
}

/**
 * Create the single owner when none exists. Email must match WTAE_OWNER_EMAIL.
 * Never logs or returns the password.
 */
export async function claimFirstOwner(
  submittedEmail: string,
  password: string,
): Promise<ClaimOwnerResult> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const configuredEmail = process.env.WTAE_OWNER_EMAIL?.trim();
  const email = normalizeOwnerEmail(submittedEmail);

  const client = databaseUrl ? new Client({ connectionString: databaseUrl }) : null;
  if (client) await client.connect();

  try {
    const ownerExists = client ? await ownerRowExists(client) : false;
    const error = claimOwnerError({
      databaseConfigured: Boolean(databaseUrl),
      configuredEmail,
      submittedEmail: email,
      password,
      ownerExists,
    });
    if (error) return { ok: false, error };
    if (!client || !databaseUrl) return { ok: false, error: "Owner login isn't ready yet." };

    const hashed = await hashPassword(password);
    const displayName = email.split("@")[0] || "Owner";
    const userId = randomUUID();

    await client.query("begin");
    try {
      const raced = await ownerRowExists(client);
      if (raced) {
        await client.query("rollback");
        return { ok: false, error: "Owner login is already set up. Sign in instead." };
      }
      await client.query(
        `insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
         values ($1, $2, $3, true, now(), now())`,
        [userId, displayName, email],
      );
      await client.query(
        `insert into account
          (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
         values ($1, $2, 'credential', $2, $3, now(), now())`,
        [randomUUID(), userId, hashed],
      );
      await client.query(
        `insert into user_profile (user_id, role, status, display_name)
         values ($1, 'owner', 'active', $2)`,
        [userId, displayName],
      );
      await client.query("commit");
    } catch (err) {
      try {
        await client.query("rollback");
      } catch {
        /* ignore */
      }
      throw err;
    }
    return { ok: true };
  } finally {
    if (client) await client.end();
  }
}
