-- Migration 0035: Add icon_key column to services table
-- Enables customizable dental & clinical icons per service

alter table public.services
  add column if not exists icon_key text default 'tooth';

comment on column public.services.icon_key is 'Curated dental icon identifier (e.g. tooth, sparkle-tooth, whitening, cleaning, checkup)';
