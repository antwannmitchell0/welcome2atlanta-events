-- Organizer booking spine. Additive. Does not rewrite owner-portal tables.
create table if not exists coverage_request (
  id text primary key,
  organizer_name text not null,
  organizer_email text not null,
  organizer_phone text not null default '',
  event_date text not null,
  neighborhood text not null,
  sku text not null,
  venue text not null,
  notes text not null default '',
  event_code text not null,
  status text not null default 'open',
  parent_request_id text,
  created_at timestamptz not null default now(),
  constraint coverage_request_sku_chk check (sku in ('room', 'night', 'block')),
  constraint coverage_request_status_chk check (status in ('open', 'booked', 'declined', 'archived')),
  constraint coverage_request_code_uq unique (event_code)
);
create index if not exists coverage_request_created_idx on coverage_request (created_at desc);
create index if not exists coverage_request_status_idx on coverage_request (status);
