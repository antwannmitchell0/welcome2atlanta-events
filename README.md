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
- Set `WTAE_FOUNDER_CLAIM_SECRET` (min 24 chars, server-only) for one-time claim.
- Optionally set `WTAE_FOUNDER_EMAILS` for an explicit authorized identity.
- The first successful claim writes `founders` and permanently closes `founder_bootstrap`.
- Later users cannot gain founder privileges automatically.

## Event management

`/portal/events` is read-only operational visibility of the curated public catalog.
The Founder Event Manager (create, edit, publish, unpublish, LIVE, schedule, archive,
codes, images, homepage / explore control) is a later phase.
