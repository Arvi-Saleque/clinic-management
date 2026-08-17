create table prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  practitioner_id uuid not null references practitioners(id),
  issued_at timestamptz not null default now(),
  notes text,
  status text not null default 'active' check (status in ('active', 'historical')),
  created_at timestamptz not null default now()
);

create table prescription_items (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references prescriptions(id) on delete cascade,
  medicine_name text not null,
  dosage text,
  frequency text,
  duration text,
  instructions text,
  created_at timestamptz not null default now()
);

-- Event-sourced like medical_history: the UI renders the latest
-- is_current = true row per (patient_id, tooth_number); history stays
-- queryable for a future "treatment timeline" view.
create table odontogram_entries (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  chart_type text not null default 'adult' check (chart_type in ('adult', 'child')),
  tooth_number text not null, -- FDI notation, e.g. '11', '48', '55'
  surface text, -- reserved for advanced (tooth-surface-level) charting in a later tier
  status text not null check (
    status in ('healthy', 'existing_treatment', 'planned_treatment', 'completed_treatment', 'missing', 'other')
  ),
  condition_note text,
  recorded_by_practitioner_id uuid not null references practitioners(id),
  appointment_id uuid references appointments(id) on delete set null,
  recorded_at timestamptz not null default now(),
  is_current boolean not null default true
);

create index prescriptions_patient_id_idx on prescriptions(patient_id);
create index prescription_items_prescription_id_idx on prescription_items(prescription_id);
create index odontogram_entries_patient_current_idx on odontogram_entries(patient_id, tooth_number) where is_current;
