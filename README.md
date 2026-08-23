# Welcome to Atlanta Events

Atlanta’s living event gallery. Find your photos from the nights that mattered.

**Find** — event or code first. Face scan is optional and on-device.  
**Bring WTAE** — request coverage for a date.  
**Creators** — apply with name, city, Instagram, availability.

## Local

```bash
npm install
npm run dev
```

## Demo codes

`ATL-404` · `ATL-BELT` · `ATL-O4W` · `ATL-INVEST` · `ATL-WTAE`

## Founder portal

`/portal` is founder-only. Server functions enforce this independently of the UI.

Bootstrap is fail-closed:

- An arbitrary public user never becomes founder.
- Set `WTAE_FOUNDER_CLAIM_SECRET` (min 24 chars, server-only, Preview + Production) for one-time claim.
- Optionally set `WTAE_FOUNDER_EMAILS` for an explicit authorized identity. Allowlist only applies to a **verified** email.
- The first successful claim writes `founders` and permanently closes `founder_bootstrap`.
- Later users cannot gain founder privileges automatically.
- Direct `/portal` server-function calls cannot bypass the UI gate.

## Persistence

Do not treat PGLite as production storage. Vercel Preview and Production must use an isolated persistent Postgres/Neon `DATABASE_URL`.

Required server env on the existing Git-connected Vercel project (Preview, not Production unless approved):

- `DATABASE_URL` — isolated Preview Postgres; never the live production database unless explicitly approved
- `BETTER_AUTH_SECRET` — stable across serverless instances
- `WTAE_FOUNDER_CLAIM_SECRET` — one-time founder bootstrap
- `WTAE_FOUNDER_EMAILS` — optional verified-email allowlist
- `VITE_AUTH_ENABLED=true` if the platform does not already inject it

`npm run build` applies `migrations/*.sql` (including `0002_wtae.sql`) when `DATABASE_URL` is present.

## Event management

`/portal/events` is **read-only operational visibility** of the curated public catalog. It is not full event administration.

Phase 2 — Founder Event Manager (not in this certification):

- create, edit, publish, unpublish
- mark LIVE, schedule, archive
- add event codes
- upload / select images
- control homepage and `/explore`

The current curated-code event catalog remains for this preview.
