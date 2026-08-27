-- Photo binaries must not live in Neon. Drop the unused bytea table if a
-- previous preview applied 0002 while it still created storage_object.
drop table if exists storage_object;
