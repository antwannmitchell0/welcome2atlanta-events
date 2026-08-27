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

`user_profile.role = photographer` and `event_assignment` are in the schema. Photographers have no UI in this phase. Server authorization rejects publish, event deletion, and unassigned-event access.

## Storage and EXIF

- Default private store: Postgres `storage_object` (bytea). Optional Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set.
- Public pages only receive `/api/media/:photoId` when the event is `published` and the photo is `ready` and not `hidden`.
- Public derivatives are re-encoded JPEGs with EXIF stripped. Originals retain EXIF privately.

## Sample galleries

`src/lib/events.ts` remains the source for demo events and codes. Database events are additive and never replace those slugs or codes.
