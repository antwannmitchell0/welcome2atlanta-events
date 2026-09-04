# WTAE owner portal

Public site: https://www.welcome2atlantaevents.com  
Owner login: https://www.welcome2atlantaevents.com/portal/login

Public signup is disabled. There is no Register button. **Resend is not required to sign in.** Forgot-password mail is the only thing that uses Resend.

## Login database (required)

Owner login stores accounts in Neon Postgres. Saving an email in Vercel does **not** create a login by itself.

Connect Neon on the live project:

1. Open the Vercel project **welcome2atlanta-events**.
2. Open **Storage**.
3. Create or install **Neon** (Create New Neon Account is fine).
4. **Connect Project** → choose **welcome2atlanta-events**.
5. Turn on **Production** and **Preview**.
6. Click **Connect**. That injects `DATABASE_URL`.
7. Wait for the site to finish updating.

Also set these on Production and Preview (Settings → Environment Variables):

- `WTAE_OWNER_EMAIL` — the email you will type on the login page
- `BETTER_AUTH_SECRET` — a long random secret (do not reuse a password)

Do **not** put `WTAE_OWNER_PASSWORD` in Vercel. Do **not** wait on Resend.

## First owner

After the database is connected, open `/portal/login`. If no owner exists yet, the first matching `WTAE_OWNER_EMAIL` plus a password of at least 10 characters **creates** the owner account. After that, the same form is regular sign-in.

The shell script is still available:

```bash
export DATABASE_URL="postgresql://..."
export WTAE_OWNER_EMAIL="owner@your-domain"
export WTAE_OWNER_PASSWORD="a long password you do not commit"
node scripts/provision-owner.mjs
```

The script is repeat-safe: it creates or updates exactly one active owner and never prints the password.

Do **not** leave `WTAE_OWNER_PASSWORD` in Vercel. Unset it after the script runs.

Reset the owner password with `/portal/forgot-password` after `RESEND_API_KEY` is configured, or re-run the provision script in a secure shell.

## Future photographers

`user_profile.role = photographer` and `event_assignment` are in the schema. Photographers have no UI in this phase. Server authorization rejects publish, event deletion, and unassigned-event access. Assigned photographers may receive upload tokens for their events.

## Storage and EXIF

- Private store: Vercel Blob (`access: "private"`) object keys only. Neon stores metadata, status and authorization — never original bytes or public JPEG derivatives.
- Browser uploads go to Blob with a short-lived grant from `/api/portal/upload`. `BLOB_READ_WRITE_TOKEN` stays server-only. Connected stores may authenticate with `BLOB_STORE_ID` + Vercel OIDC instead of a long-lived token.
- Object keys are server-assigned: `events/{eventId}/{photoId}.{jpg|png|webp}`.
- Public pages only receive `/api/media/:photoId` when the event is `published` and the photo is `ready` and not `hidden`.
- Public derivatives are EXIF-stripped. Originals retain EXIF privately in Blob.
- HEIC/HEIF is **not supported** in this release. Convert to JPEG or PNG on the device first.

## Sample galleries

`src/lib/events.ts` remains the source for demo events and codes. Database events are additive and never replace those slugs or codes. Demo rooms render as **PREVIEW**, never as LIVE.

Public derivatives stay EXIF-stripped (`src/lib/portal/image-process.ts`). The `{Neighborhood} · WTAE` mark is overlaid on public delivery and downloads — it is not baked into the private Blob original.

## Coverage requests (Loop 1)

Public organizer booking at `/events` writes `coverage_request` (migration `0004_coverage_requests.sql`) and mints a unique `ATL-XXXX` code. Reserved demo codes stay blocked: ATL-404, ATL-BELT, ATL-O4W, ATL-INVEST, ATL-WTAE.

New rows appear on `/portal` under Coverage requests. Print the door card at `/print/code/:code`. Guest photos stay free.

