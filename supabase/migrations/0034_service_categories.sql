-- Migration: 0034_service_categories.sql
-- Description: Authoritative relational service categories with backfill, foreign key on delete restrict, updated_at trigger, and organization-scoped RLS

-- 1. Create service_categories table
create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_categories_org_name_unique unique (organization_id, name)
);

create index if not exists service_categories_org_idx on public.service_categories(organization_id);

-- 2. Backfill existing categories from services into service_categories per organization
insert into public.service_categories (organization_id, name)
select distinct organization_id, trim(category)
from public.services
where category is not null and trim(category) <> ''
on conflict (organization_id, name) do nothing;

-- Ensure default General Dentistry category exists for all organizations with services
insert into public.service_categories (organization_id, name)
select distinct organization_id, 'General Dentistry'
from public.services
on conflict (organization_id, name) do nothing;

-- 3. Add relational category_id column to services table with foreign key ON DELETE RESTRICT
alter table public.services
  add column if not exists category_id uuid references public.service_categories(id) on delete restrict;

create index if not exists services_category_id_idx on public.services(category_id);

-- 4. Map existing services to their corresponding category_id
update public.services s
set category_id = sc.id
from public.service_categories sc
where sc.organization_id = s.organization_id
  and sc.name = trim(s.category)
  and s.category_id is null;

-- Fallback for any service without a matched category_id
update public.services s
set category_id = sc.id
from public.service_categories sc
where sc.organization_id = s.organization_id
  and sc.name = 'General Dentistry'
  and s.category_id is null;

-- 5. Enforce NOT NULL constraint on category_id
alter table public.services
  alter column category_id set not null;

-- 6. Remove legacy text column category once fully migrated to relational category_id
alter table public.services
  drop column if exists category;

-- 7. Automatic updated_at trigger for service_categories
create or replace function private.set_service_categories_updated_at() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists service_categories_updated_at_trg on public.service_categories;
create trigger service_categories_updated_at_trg
  before update on public.service_categories
  for each row execute function private.set_service_categories_updated_at();

-- 8. Row Level Security for service_categories
alter table public.service_categories enable row level security;

-- Drop previous policies if existing
drop policy if exists service_categories_public_read on public.service_categories;
drop policy if exists service_categories_clinician_all on public.service_categories;
drop policy if exists service_categories_staff_read on public.service_categories;
drop policy if exists service_categories_clinician_write on public.service_categories;

-- Authenticated staff & patients can view categories in their own organization
create policy service_categories_staff_read on public.service_categories
  for select to authenticated
  using (organization_id = private.current_org_id());

-- Public marketing read: anon can view categories that have active public services
create policy service_categories_public_read on public.service_categories
  for select to anon
  using (
    exists (
      select 1 from public.services s
      where s.category_id = service_categories.id
        and s.show_on_website = true
        and s.is_active = true
    )
  );

-- Owner_admin and dentists can manage categories within their own organization
create policy service_categories_clinician_write on public.service_categories
  for all to authenticated
  using (
    organization_id = private.current_org_id()
    and private.current_role() in ('owner_admin', 'dentist')
  )
  with check (
    organization_id = private.current_org_id()
    and private.current_role() in ('owner_admin', 'dentist')
  );
