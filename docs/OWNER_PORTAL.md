# WTAE owner portal

## First-owner provisioning

Public signup is disabled. Create the first owner in a secure shell:

```bash
export DATABASE_URL="postgresql://..."
export WTAE_OWNER_EMAIL="owner@your-domain"
export WTAE_OWNER_PASSWORD="a long password you do not commit"
node scripts/provision-owner.mjs
```

The script is repeat-safe. If an owner profile already exists it exits without creating another.

Reset the owner password with `/portal/forgot-password` after `RESEND_API_KEY` is configured.

## Future photographers

`user_profile.role = photographer` and `event_assignment` are in the schema. Photographers have no UI in this phase. Server authorization rejects publish, event deletion, and unassigned-event access. Assigned photographers may receive upload tokens for their events.

## Storage and EXIF

- Private store: Vercel Blob (`access: "private"`) object keys only. Neon stores metadata, status and authorization — never original bytes or public JPEG derivatives.
- Browser uploads go to Blob with a short-lived token from `/api/portal/upload`. `BLOB_READ_WRITE_TOKEN` stays server-only.
- Object keys are server-assigned: `events/{eventId}/{photoId}.{jpg|png|webp}`.
- Public pages only receive `/api/media/:photoId` when the event is `published` and the photo is `ready` and not `hidden`.
- Public derivatives are EXIF-stripped. Originals retain EXIF privately in Blob.
- HEIC/HEIF is **not supported** in this release. Convert to JPEG or PNG on the device first.

## Sample galleries

`src/lib/events.ts` remains the source for demo events and codes. Database events are additive and never replace those slugs or codes.
