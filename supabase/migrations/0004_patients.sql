create table patients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  -- null until the patient creates/links a portal login; staff can create
  -- patients (walk-in/phone) with no profile_id at all.
  profile_id uuid unique references profiles(id) on delete set null,
  first_name text not null,
  last_name text not null,
  dob date,
  gender text,
  phone text,
  email text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_by_staff_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table family_links (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  guardian_patient_id uuid references patients(id) on delete set null,
  guardian_name text,
  guardian_relationship text,
  guardian_phone text,
  guardian_email text,
  is_primary_contact boolean not null default false,
  created_at timestamptz not null default now()
);

-- Append-only, versioned. UI reads the row where is_current = true; every
-- prior version stays queryable for audit/history.
create table medical_history (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  version int not null,
  recorded_by_staff_id uuid references profiles(id) on delete set null,
  source text not null check (source in ('digital_intake', 'staff_update')),
  allergies text[] not null default '{}',
  current_medications text[] not null default '{}',
  chronic_conditions text[] not null default '{}',
  past_surgeries text,
  notes text,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  unique (patient_id, version)
);

create table registration_submissions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  form_version int not null default 1,
  raw_payload jsonb not null,
  status text not null default 'pending_review' check (status in ('pending_review', 'reviewed')),
  reviewed_by_staff_id uuid references profiles(id) on delete set null,
  reviewed_at timestamptz
);

create index patients_organization_id_idx on patients(organization_id);
create index patients_profile_id_idx on patients(profile_id);
create index family_links_patient_id_idx on family_links(patient_id);
create index medical_history_patient_id_idx on medical_history(patient_id) where is_current;
create index registration_submissions_patient_id_idx on registration_submissions(patient_id);
