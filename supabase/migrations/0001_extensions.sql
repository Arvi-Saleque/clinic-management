-- Extensions used across the schema.
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists btree_gist; -- exclusion constraints (double-booking prevention)
