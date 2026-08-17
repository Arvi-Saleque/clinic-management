create table practitioners (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  title text,
  bio text,
  specialties text[] not null default '{}',
  photo_url text,
  is_bookable boolean not null default true,
  created_at timestamptz not null default now()
);

create table services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid references branches(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  duration_minutes int not null check (duration_minutes > 0),
  price numeric(10, 2) not null default 0,
  category text,
  is_active boolean not null default true,
  show_on_website boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table practitioner_services (
  practitioner_id uuid not null references practitioners(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  override_duration_minutes int,
  override_price numeric(10, 2),
  primary key (practitioner_id, service_id)
);

create index practitioners_branch_id_idx on practitioners(branch_id);
create index services_organization_id_idx on services(organization_id);
