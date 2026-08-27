#!/usr/bin/env node
/**
 * Create or update the single WTAE owner. Public signup is disabled.
 *
 *   export DATABASE_URL="postgresql://..."
 *   export WTAE_OWNER_EMAIL="owner@your-domain"
 *   export WTAE_OWNER_PASSWORD="a long password you do not commit"
 *   node scripts/provision-owner.mjs
 *
 * Never prints the password. Do not leave WTAE_OWNER_PASSWORD in Vercel env.
 * After first run, unset it. Reset later with /portal/forgot-password (Resend)
 * or re-run this script in a secure shell.
 */
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import pg from "pg";

const MIN_PASSWORD = 10;

function required(name) {
  const value = process.env[name];
  if (typeof value !== "string" || !value.trim()) {
    console.error(`Set ${name}.`);
    process.exit(1);
  }
  return value.trim();
}

const databaseUrl = required("DATABASE_URL");
const email = required("WTAE_OWNER_EMAIL").toLowerCase();
const password = process.env.WTAE_OWNER_PASSWORD;
if (typeof password !== "string" || password.length < MIN_PASSWORD) {
  console.error(`Set WTAE_OWNER_PASSWORD to at least ${MIN_PASSWORD} characters.`);
  process.exit(1);
}

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

try {
  await client.query("begin");
  const existing = await client.query(
    `select user_id, display_name from user_profile where role = 'owner' order by created_at asc limit 1`,
  );
  const hashed = await hashPassword(password);
  const displayName = email.split("@")[0] || "Owner";

  if (existing.rows[0]) {
    const userId = existing.rows[0].user_id;
    await client.query(
      `update "user"
       set email = $2, name = $3, "emailVerified" = true, "updatedAt" = now()
       where id = $1`,
      [userId, email, displayName],
    );
    const account = await client.query(
      `select id from account where "userId" = $1 and "providerId" = 'credential' limit 1`,
      [userId],
    );
    if (account.rows[0]) {
      await client.query(
        `update account set password = $2, "accountId" = $3, "updatedAt" = now() where id = $1`,
        [account.rows[0].id, hashed, userId],
      );
    } else {
      await client.query(
        `insert into account
          (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
         values ($1, $2, 'credential', $2, $3, now(), now())`,
        [randomUUID(), userId, hashed],
      );
    }
    await client.query(
      `update user_profile
       set status = 'active', display_name = $2, updated_at = now()
       where user_id = $1`,
      [userId, displayName],
    );
    await client.query("commit");
    console.log("Owner updated. Password was not printed.");
  } else {
    const userId = randomUUID();
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
    console.log("Owner created. Password was not printed.");
  }
} catch (err) {
  try {
    await client.query("rollback");
  } catch {
    /* ignore */
  }
  console.error("Owner provisioning failed.");
  process.exitCode = 1;
  throw err;
} finally {
  await client.end();
}
