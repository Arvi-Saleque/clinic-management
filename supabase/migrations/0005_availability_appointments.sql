create table availability_rules (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references practitioners(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null check (end_time > start_time),
  effective_from date not null default current_date,
  effective_to date
);

create table availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references practitioners(id) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  is_unavailable boolean not null default true,
  reason text
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  practitioner_id uuid not null references practitioners(id) on delete cascade,
  service_id uuid not null references services(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  status text not null default 'pending' check (
    status in ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show')
  ),
  booking_source text not null check (booking_source in ('staff', 'online', 'phone')),
  created_by_profile_id uuid references profiles(id) on delete set null,
  notes text,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- DB-level double-booking guarantee: no two non-cancelled appointments for
-- the same practitioner may have overlapping time ranges. This is the
-- backstop behind the RPC's own re-check at write time.
alter table appointments
  add constraint appointments_no_overlap
  exclude using gist (
    practitioner_id with =,
    tstzrange(starts_at, ends_at) with &&
  )
  where (status not in ('cancelled', 'no_show'));

create table booking_deposits (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  amount numeric(10, 2) not null default 0,
  currency text not null default 'GBP',
  status text not null default 'not_required' check (
    status in ('not_required', 'pending', 'paid', 'refunded', 'waived')
  ),
  payment_reference text,
  created_at timestamptz not null default now()
);

alter table appointments
  add column deposit_id uuid references booking_deposits(id) on delete set null;

create index availability_rules_practitioner_id_idx on availability_rules(practitioner_id);
create index availability_exceptions_practitioner_date_idx on availability_exceptions(practitioner_id, date);
create index appointments_patient_id_idx on appointments(patient_id);
create index appointments_practitioner_starts_at_idx on appointments(practitioner_id, starts_at);
create index appointments_organization_id_idx on appointments(organization_id);
