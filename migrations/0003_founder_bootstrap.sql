create table if not exists founder_bootstrap (
  id integer primary key check (id = 1),
  closed boolean not null default false,
  closed_at timestamptz,
  claimed_user_id text
);

insert into founder_bootstrap (id, closed)
values (1, false)
on conflict (id) do nothing;
