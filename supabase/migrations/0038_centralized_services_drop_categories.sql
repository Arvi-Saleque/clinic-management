-- Make category_id nullable on services for centralized catalog without category requirement
alter table public.services alter column category_id drop not null;
