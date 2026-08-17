-- ---------------------------------------------------------------------
-- 0021_clinical_encounters_and_attachments.sql
-- Phase 2A.4: Final Hardened Clinical Encounter & Attachments Foundation
-- ---------------------------------------------------------------------
-- 1. Helpers: `private.current_practitioner_id()`,
--    `private.enforce_encounter_immutability()`,
--    `private.enforce_private_notes_immutability()`, and
--    `private.enforce_attachment_immutability()`.
-- 2. Prerequisite unique constraints on existing `appointments` and `patients`
--    guaranteeing multi-tenant & patient consistency even with nullable FKs.
-- 3. Creates `clinical_encounters` with explicit data constraints & immutability.
-- 4. Creates `clinical_encounter_private_notes` with zero patient exposure.
-- 5. Creates `clinical_attachments` with explicit patient visibility control.
-- 6. Configures `ON DELETE NO ACTION` on appointment/encounter/attachment FKs
--    to prevent accidental deletion of clinical history while preserving
--    statement-level multi-table tenant cascade deletes.
-- 7. Configures dual-composite FKs + check constraints on prescriptions &
--    odontogram entries to eliminate MATCH SIMPLE nullable bypasses.
-- 8. Scopes clinical record access strictly to `is_clinician()` (receptionists blocked).
-- 9. Configures RLS policies, performance indexes, and audit trail triggers.
-- ---------------------------------------------------------------------

-- 1. Helper Functions

-- Multi-tenant aware practitioner identity resolver
create or replace function private.current_practitioner_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select p.id
  from public.practitioners p
  join public.profiles pr on pr.id = p.profile_id
  where p.profile_id = (select auth.uid())
    and pr.organization_id = private.current_org_id()
$$;

revoke execute on function private.current_practitioner_id() from public;
grant execute on function private.current_practitioner_id() to authenticated;

-- Trigger function enforcing encounter identity immutability and completed state lockdown
create or replace function private.enforce_encounter_immutability() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Enforce practitioner belongs to encounter organization on insert and update
  if not private.practitioner_in_org(NEW.practitioner_id) then
    raise exception 'Practitioner does not belong to the encounter organization';
  end if;

  if TG_OP = 'UPDATE' then
    -- Prevent altering core identity relationships after creation
    if OLD.organization_id != NEW.organization_id
       or OLD.patient_id != NEW.patient_id
       or OLD.practitioner_id != NEW.practitioner_id
       or OLD.appointment_id is distinct from NEW.appointment_id
       or OLD.started_at != NEW.started_at then
      raise exception 'Clinical encounter identity fields (organization_id, patient_id, practitioner_id, appointment_id, started_at) cannot be modified after creation';
    end if;

    -- Prevent altering completed or cancelled historical records
    if OLD.status in ('completed', 'cancelled') then
      raise exception 'Completed or cancelled clinical encounters are immutable';
    end if;

    NEW.updated_at := now();
  end if;

  return NEW;
end;
$$;

-- Trigger function enforcing private note immutability
create or replace function private.enforce_private_notes_immutability() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_status text;
begin
  if TG_OP = 'UPDATE' then
    if OLD.encounter_id != NEW.encounter_id
       or OLD.organization_id != NEW.organization_id
       or OLD.created_at != NEW.created_at then
      raise exception 'Private note identity fields (encounter_id, organization_id, created_at) cannot be modified';
    end if;

    select status into v_status
    from public.clinical_encounters
    where id = OLD.encounter_id;

    if v_status is null or v_status != 'in_progress' then
      raise exception 'Private clinical notes can only be modified while the parent encounter is in_progress';
    end if;

    NEW.updated_at := now();
  end if;

  return NEW;
end;
$$;

-- Trigger function enforcing attachment immutability
create or replace function private.enforce_attachment_immutability() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_encounter_status text;
begin
  if TG_OP = 'UPDATE' then
    -- Protect core identity fields from being mutated
    if OLD.organization_id != NEW.organization_id
       or OLD.patient_id != NEW.patient_id
       or OLD.encounter_id is distinct from NEW.encounter_id
       or OLD.uploaded_by_profile_id is distinct from NEW.uploaded_by_profile_id
       or OLD.storage_path != NEW.storage_path
       or OLD.created_at != NEW.created_at then
      raise exception 'Clinical attachment identity fields (organization_id, patient_id, encounter_id, uploaded_by_profile_id, storage_path, created_at) cannot be modified';
    end if;

    -- If linked to an encounter, verify encounter is in_progress for normal dentist edits
    if OLD.encounter_id is not null then
      select status into v_encounter_status
      from public.clinical_encounters
      where id = OLD.encounter_id;

      if v_encounter_status is not null and v_encounter_status in ('completed', 'cancelled') and private.current_role() != 'owner_admin' then
        raise exception 'Attachments linked to completed or cancelled encounters cannot be modified';
      end if;
    end if;
  end if;

  return NEW;
end;
$$;

-- 2. Prerequisite Constraints on Existing Tables for Tenant & Patient Integrity
alter table appointments
  add constraint appointments_id_patient_practitioner_org_unique
  unique (id, patient_id, practitioner_id, organization_id);

alter table patients
  add constraint patients_id_org_unique
  unique (id, organization_id);

-- 3. Clinical Encounters Table
create table if not exists clinical_encounters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  patient_id uuid not null,
  practitioner_id uuid not null references practitioners(id) on delete no action,
  appointment_id uuid,
  status text not null default 'in_progress' check (
    status in ('in_progress', 'completed', 'cancelled')
  ),
  chief_complaint text,
  diagnosis text,
  performed_treatment text,
  patient_notes text,
  follow_up_recommended boolean not null default false,
  follow_up_date date,
  follow_up_reason text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 1:1 between appointment and primary clinical encounter
  constraint clinical_encounters_appointment_id_unique unique (appointment_id),

  -- Independent Tenant & Patient Integrity (even when appointment_id is null)
  constraint clinical_encounters_patient_org_fk
    foreign key (patient_id, organization_id)
    references patients(id, organization_id)
    on delete no action,

  -- Composite FK ensuring encounter matches appointment's patient, practitioner, and org exactly.
  -- ON DELETE NO ACTION prevents standalone deletion of appointments with clinical encounters.
  constraint clinical_encounters_appointment_fk
    foreign key (appointment_id, patient_id, practitioner_id, organization_id)
    references appointments(id, patient_id, practitioner_id, organization_id)
    on delete no action,

  -- Composite unique constraints for downstream attachment, prescription, and private note consistency
  constraint clinical_encounters_id_patient_unique unique (id, patient_id),
  constraint clinical_encounters_id_org_unique unique (id, organization_id),
  constraint clinical_encounters_id_patient_org_unique unique (id, patient_id, organization_id),
  constraint clinical_encounters_id_patient_practitioner_org_unique unique (id, patient_id, practitioner_id, organization_id),
  constraint clinical_encounters_id_appt_patient_unique unique (id, appointment_id, patient_id),

  -- Data Integrity Constraints
  constraint clinical_encounters_completed_after_start
    check (completed_at is null or completed_at >= started_at),
  constraint clinical_encounters_status_completed_at_check
    check (
      (status = 'completed' and completed_at is not null)
      or (status in ('in_progress', 'cancelled') and completed_at is null)
    ),
  constraint clinical_encounters_follow_up_consistency
    check (
      (follow_up_recommended = false and follow_up_date is null and follow_up_reason is null)
      or (follow_up_recommended = true and follow_up_date is not null)
    )
);

-- 4. Dedicated Private Clinician Notes Table (Zero Patient Exposure)
create table if not exists clinical_encounter_private_notes (
  encounter_id uuid primary key,
  organization_id uuid not null,
  clinical_notes text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Guaranteed matching organization
  constraint clinical_private_notes_encounter_fk
    foreign key (encounter_id, organization_id)
    references clinical_encounters(id, organization_id)
    on delete cascade
);

-- 5. Clinical Attachments Table
create table if not exists clinical_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  patient_id uuid not null,
  encounter_id uuid,
  uploaded_by_profile_id uuid references profiles(id) on delete set null,
  file_name text not null,
  file_type text not null,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  storage_path text not null,
  category text not null default 'other' check (
    category in ('x_ray', 'photo', 'scan', 'lab_report', 'prescription_scan', 'other')
  ),
  is_patient_visible boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),

  -- Independent Tenant & Patient Integrity (even when encounter_id is null)
  constraint clinical_attachments_patient_org_fk
    foreign key (patient_id, organization_id)
    references patients(id, organization_id)
    on delete no action,

  -- Guaranteed matching patient and organization when attached to an encounter.
  -- ON DELETE NO ACTION blocks deletion of encounters with active clinical attachments.
  constraint clinical_attachments_encounter_fk
    foreign key (encounter_id, patient_id, organization_id)
    references clinical_encounters(id, patient_id, organization_id)
    on delete no action
);

-- 6. Link Existing Tables to Clinical Encounters (Backward Compatible & Nullable)
alter table appointments
  add column if not exists originating_encounter_id uuid,
  add constraint appointments_originating_encounter_fk
    foreign key (originating_encounter_id, patient_id, practitioner_id, organization_id)
    references clinical_encounters(id, patient_id, practitioner_id, organization_id)
    on delete set null (originating_encounter_id);

alter table prescriptions
  add column if not exists encounter_id uuid,
  add constraint prescriptions_encounter_patient_fk
    foreign key (encounter_id, patient_id)
    references clinical_encounters(id, patient_id)
    on delete set null (encounter_id),
  add constraint prescriptions_encounter_visit_fk
    foreign key (encounter_id, appointment_id, patient_id)
    references clinical_encounters(id, appointment_id, patient_id)
    on delete set null (encounter_id, appointment_id),
  add constraint prescriptions_encounter_appointment_check
    check (encounter_id is null or appointment_id is not null);

alter table odontogram_entries
  add column if not exists encounter_id uuid,
  add constraint odontogram_entries_encounter_patient_fk
    foreign key (encounter_id, patient_id)
    references clinical_encounters(id, patient_id)
    on delete set null (encounter_id),
  add constraint odontogram_entries_encounter_visit_fk
    foreign key (encounter_id, appointment_id, patient_id)
    references clinical_encounters(id, appointment_id, patient_id)
    on delete set null (encounter_id, appointment_id),
  add constraint odontogram_entries_encounter_appointment_check
    check (encounter_id is null or appointment_id is not null);

-- 7. Performance & Foreign Key Indexes
create index if not exists clinical_encounters_patient_id_idx on clinical_encounters(patient_id);
create index if not exists clinical_encounters_practitioner_id_idx on clinical_encounters(practitioner_id);
create index if not exists clinical_encounters_organization_id_idx on clinical_encounters(organization_id);
create index if not exists clinical_encounters_started_at_idx on clinical_encounters(started_at);

create index if not exists clinical_attachments_patient_vis_idx on clinical_attachments(patient_id, is_patient_visible);
create index if not exists clinical_attachments_encounter_id_idx on clinical_attachments(encounter_id);
create index if not exists clinical_attachments_organization_id_idx on clinical_attachments(organization_id);

create index if not exists appointments_originating_encounter_id_idx on appointments(originating_encounter_id);
create index if not exists appointments_service_id_idx on appointments(service_id);
create index if not exists prescriptions_encounter_id_idx on prescriptions(encounter_id);
create index if not exists prescriptions_appointment_id_idx on prescriptions(appointment_id);
create index if not exists odontogram_entries_encounter_id_idx on odontogram_entries(encounter_id);
create index if not exists invoices_appointment_id_idx on invoices(appointment_id);

-- 8. Row Level Security (RLS)

alter table clinical_encounters enable row level security;
alter table clinical_encounter_private_notes enable row level security;
alter table clinical_attachments enable row level security;

-- Encounters RLS Policies (Restricted strictly to clinicians; receptionists cannot read clinical records)
create policy clinical_encounters_clinician_read on clinical_encounters
  for select to authenticated
  using (
    organization_id = private.current_org_id() and private.is_clinician()
  );

create policy clinical_encounters_patient_self_read on clinical_encounters
  for select to authenticated
  using (
    patient_id = private.current_patient_id()
  );

create policy clinical_encounters_clinician_insert on clinical_encounters
  for insert to authenticated
  with check (
    organization_id = private.current_org_id()
    and (
      (private.current_role() = 'dentist' and practitioner_id = private.current_practitioner_id())
      or (private.current_role() = 'owner_admin' and private.practitioner_in_org(practitioner_id))
    )
  );

create policy clinical_encounters_clinician_update on clinical_encounters
  for update to authenticated
  using (
    organization_id = private.current_org_id()
    and status = 'in_progress'
    and (
      (private.current_role() = 'dentist' and practitioner_id = private.current_practitioner_id())
      or private.current_role() = 'owner_admin'
    )
  )
  with check (
    organization_id = private.current_org_id()
    and (
      (private.current_role() = 'dentist' and practitioner_id = private.current_practitioner_id())
      or private.current_role() = 'owner_admin'
    )
    and status in ('in_progress', 'completed', 'cancelled')
  );

-- Private Clinician Notes RLS Policies (Patients have NO policies)
create policy clinical_private_notes_clinician_read on clinical_encounter_private_notes
  for select to authenticated
  using (
    organization_id = private.current_org_id() and private.is_clinician()
  );

create policy clinical_private_notes_clinician_insert on clinical_encounter_private_notes
  for insert to authenticated
  with check (
    organization_id = private.current_org_id()
    and encounter_id in (
      select id from clinical_encounters
      where status = 'in_progress'
        and organization_id = private.current_org_id()
        and (
          (private.current_role() = 'dentist' and practitioner_id = private.current_practitioner_id())
          or private.current_role() = 'owner_admin'
        )
    )
  );

create policy clinical_private_notes_clinician_update on clinical_encounter_private_notes
  for update to authenticated
  using (
    organization_id = private.current_org_id()
    and encounter_id in (
      select id from clinical_encounters
      where status = 'in_progress'
        and organization_id = private.current_org_id()
        and (
          (private.current_role() = 'dentist' and practitioner_id = private.current_practitioner_id())
          or private.current_role() = 'owner_admin'
        )
    )
  )
  with check (
    organization_id = private.current_org_id()
    and encounter_id in (
      select id from clinical_encounters
      where status = 'in_progress'
        and organization_id = private.current_org_id()
        and (
          (private.current_role() = 'dentist' and practitioner_id = private.current_practitioner_id())
          or private.current_role() = 'owner_admin'
        )
    )
  );

-- Attachments RLS Policies (Restricted to clinicians; receptionists cannot read medical files)
create policy clinical_attachments_clinician_read on clinical_attachments
  for select to authenticated
  using (
    organization_id = private.current_org_id() and private.is_clinician()
  );

create policy clinical_attachments_patient_self_read on clinical_attachments
  for select to authenticated
  using (
    patient_id = private.current_patient_id()
    and is_patient_visible = true
  );

create policy clinical_attachments_clinician_insert on clinical_attachments
  for insert to authenticated
  with check (
    organization_id = private.current_org_id()
    and (
      private.current_role() = 'owner_admin'
      or (
        private.current_role() = 'dentist'
        and encounter_id is not null
        and encounter_id in (
          select id from clinical_encounters
          where practitioner_id = private.current_practitioner_id()
            and status = 'in_progress'
        )
      )
    )
  );

create policy clinical_attachments_clinician_update on clinical_attachments
  for update to authenticated
  using (
    organization_id = private.current_org_id()
    and (
      private.current_role() = 'owner_admin'
      or (
        private.current_role() = 'dentist'
        and encounter_id is not null
        and encounter_id in (
          select id from clinical_encounters
          where practitioner_id = private.current_practitioner_id()
            and status = 'in_progress'
        )
      )
    )
  )
  with check (
    organization_id = private.current_org_id()
    and (
      private.current_role() = 'owner_admin'
      or (
        private.current_role() = 'dentist'
        and encounter_id is not null
        and encounter_id in (
          select id from clinical_encounters
          where practitioner_id = private.current_practitioner_id()
            and status = 'in_progress'
        )
      )
    )
  );

create policy clinical_attachments_clinician_delete on clinical_attachments
  for delete to authenticated
  using (
    organization_id = private.current_org_id()
    and (
      private.current_role() = 'owner_admin'
      or (
        private.current_role() = 'dentist'
        and encounter_id is not null
        and encounter_id in (
          select id from clinical_encounters
          where practitioner_id = private.current_practitioner_id()
            and status = 'in_progress'
        )
      )
    )
  );

-- 9. Immutability and Audit Trail Triggers
create trigger trg_enforce_encounter_immutability
  before insert or update on clinical_encounters
  for each row execute function private.enforce_encounter_immutability();

create trigger trg_enforce_private_notes_immutability
  before update on clinical_encounter_private_notes
  for each row execute function private.enforce_private_notes_immutability();

create trigger trg_enforce_attachment_immutability
  before update on clinical_attachments
  for each row execute function private.enforce_attachment_immutability();

create trigger trg_audit_clinical_encounters
  after insert or update or delete on clinical_encounters
  for each row execute function private.audit_log();

create trigger trg_audit_clinical_private_notes
  after insert or update or delete on clinical_encounter_private_notes
  for each row execute function private.audit_log();

create trigger trg_audit_clinical_attachments
  after insert or update or delete on clinical_attachments
  for each row execute function private.audit_log();
