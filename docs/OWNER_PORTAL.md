# WTAE owner portal

Public site: https://www.welcome2atlantaevents.com  
Owner login: https://www.welcome2atlantaevents.com/portal/login

Public signup is disabled. There is no Register button.

## First-owner provisioning

Create the first owner in a secure shell:

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

`src/lib/events.ts` remains the source for demo events and codes. Database events are additive and never replace those slugs or codes.
