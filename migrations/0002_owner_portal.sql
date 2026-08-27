-- Additive owner-portal schema. Does not drop or rewrite existing tables.
create table if not exists user_profile (
  user_id text primary key,
  role text not null,
  status text not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profile_role_chk check (role in ('owner', 'photographer')),
  constraint user_profile_status_chk check (status in ('active', 'invited', 'disabled'))
);
create index if not exists user_profile_role_idx on user_profile (role);
create index if not exists user_profile_status_idx on user_profile (status);

create table if not exists gallery_event (
  id text primary key,
  name text not null,
  slug text not null,
  event_code text not null,
  event_date text not null,
  start_time text,
  venue text not null default '',
  neighborhood text not null default '',
  description text not null default '',
  status text not null default 'draft',
  cover_photo_id text,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint gallery_event_status_chk check (status in ('draft', 'published', 'archived')),
  constraint gallery_event_slug_uq unique (slug),
  constraint gallery_event_code_uq unique (event_code)
);
create index if not exists gallery_event_status_idx on gallery_event (status);
create index if not exists gallery_event_updated_idx on gallery_event (updated_at desc);

create table if not exists gallery_photo (
  id text primary key,
  event_id text not null references gallery_event (id) on delete restrict,
  storage_key text not null,
  derivative_key text,
  original_filename text not null,
  display_filename text not null,
  mime_type text not null,
  file_size integer not null,
  width integer,
  height integer,
  checksum text not null,
  upload_status text not null default 'uploading',
  processing_error text,
  sort_order integer not null default 0,
  featured boolean not null default false,
  hidden boolean not null default false,
  uploaded_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gallery_photo_status_chk check (upload_status in ('uploading', 'processing', 'ready', 'failed')),
  constraint gallery_photo_event_checksum_uq unique (event_id, checksum),
  constraint gallery_photo_storage_uq unique (storage_key)
);
create index if not exists gallery_photo_event_idx on gallery_photo (event_id, sort_order);

create table if not exists event_assignment (
  id text primary key,
  event_id text not null references gallery_event (id) on delete restrict,
  photographer_user_id text not null,
  assignment_status text not null default 'active',
  created_at timestamptz not null default now(),
  constraint event_assignment_status_chk check (assignment_status in ('active', 'revoked')),
  constraint event_assignment_uq unique (event_id, photographer_user_id)
);

create table if not exists upload_failure (
  id text primary key,
  event_id text,
  user_id text not null,
  filename text not null,
  message text not null,
  created_at timestamptz not null default now()
);
create index if not exists upload_failure_created_idx on upload_failure (created_at desc);
