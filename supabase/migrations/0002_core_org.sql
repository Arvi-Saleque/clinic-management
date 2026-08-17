-- Organizations, branches, opening hours, and the profiles table that
-- mirrors auth.users with a role. `profiles.role` is the single source of
-- truth every RLS policy in later migrations checks against.

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan_tier text not null default 'basic' check (plan_tier in ('basic', 'medium', 'advanced')),
  created_at timestamptz not null default now()
);

create table branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  address text,
  phone text,
  email text,
  timezone text not null default 'Asia/Dhaka',
  is_primary boolean not null default true,
  created_at timestamptz not null default now()
);

create table opening_hours (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0 = Sunday
  open_time time,
  close_time time,
  is_closed boolean not null default false
);

-- One row per auth.users row. role drives every RLS policy downstream.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  role text not null check (role in ('owner_admin', 'receptionist', 'dentist', 'patient')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_organization_id_idx on profiles(organization_id);
create index branches_organization_id_idx on branches(organization_id);
create index opening_hours_branch_id_idx on opening_hours(branch_id);
