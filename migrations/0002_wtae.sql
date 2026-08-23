create table if not exists event_requests (
  id serial primary key,
  requester_name text not null,
  email text not null,
  phone text,
  event_name text not null,
  event_type text,
  event_date text,
  event_time text,
  venue_name text,
  venue_address text,
  expected_attendance text,
  website_or_event_link text,
  instagram text,
  coverage_requested text,
  message text,
  status text not null default 'new',
  founder_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_requests_status_chk check (
    status in ('new', 'reviewing', 'contacted', 'approved', 'declined', 'completed')
  )
);

create index if not exists event_requests_created_idx on event_requests (created_at desc);
create index if not exists event_requests_status_idx on event_requests (status);
create index if not exists event_requests_email_idx on event_requests (email);

create table if not exists photographer_applications (
  id serial primary key,
  full_name text not null,
  email text not null,
  phone text,
  city text,
  instagram text,
  portfolio_url text,
  years_experience text,
  camera_equipment text,
  event_experience text,
  transportation text,
  availability text,
  why_wtae text,
  status text not null default 'new',
  founder_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint photographer_applications_status_chk check (
    status in ('new', 'reviewing', 'interview', 'approved', 'declined')
  )
);

create index if not exists photographer_applications_created_idx on photographer_applications (created_at desc);
create index if not exists photographer_applications_status_idx on photographer_applications (status);
create index if not exists photographer_applications_email_idx on photographer_applications (email);

create table if not exists founders (
  user_id text primary key,
  created_at timestamptz not null default now()
);

create table if not exists founder_bootstrap (
  id integer primary key check (id = 1),
  closed boolean not null default false,
  closed_at timestamptz,
  claimed_user_id text
);

insert into founder_bootstrap (id, closed)
values (1, false)
on conflict (id) do nothing;
