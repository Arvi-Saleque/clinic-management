-- ---------------------------------------------------------------------
-- 0030_atomic_clinical_prescription_rpc.sql
-- Phase 5I.5-A: Atomic Clinical Prescription RPC & Completed-Rx Immutability
-- ---------------------------------------------------------------------
-- 1. Extends `private.audit_log()` to resolve tenant organization_id
--    from `prescription_id` -> `prescriptions.patient_id` -> `patients.organization_id`.
-- 2. Attaches `trg_audit_prescription_items` to `public.prescription_items`.
-- 3. Adds `private.check_prescription_encounter_immutability()` trigger function
--    and attaches `trg_protect_completed_encounter_prescriptions` to `public.prescriptions`.
-- 4. Adds `private.check_prescription_item_encounter_immutability()` trigger function
--    and attaches `trg_protect_completed_encounter_prescription_items` to `public.prescription_items`.
-- 5. Implements `public.create_clinical_prescription(p_patient_id uuid, p_encounter_id uuid, p_notes text, p_items jsonb)`
--    supporting atomic creation for standalone and encounter-linked prescriptions
--    with hardened JSON type validation.
-- ---------------------------------------------------------------------

-- =====================================================================
-- 1. Extend private.audit_log() for prescription_items
-- =====================================================================

create or replace function private.audit_log() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_new jsonb := case when TG_OP = 'DELETE' then null else to_jsonb(NEW) end;
  v_old jsonb := case when TG_OP = 'INSERT' then null else to_jsonb(OLD) end;
  v_org_id uuid;
  v_patient_id uuid;
  v_invoice_id uuid;
  v_prescription_id uuid;
  v_entity_id uuid;
begin
  -- 1. Direct organization_id
  v_org_id := coalesce((v_new ->> 'organization_id')::uuid, (v_old ->> 'organization_id')::uuid);

  -- 2. Patient lookup
  if v_org_id is null then
    v_patient_id := coalesce((v_new ->> 'patient_id')::uuid, (v_old ->> 'patient_id')::uuid);
    if v_patient_id is not null then
      select organization_id into v_org_id from public.patients where id = v_patient_id;
    end if;
  end if;

  -- 3. Invoice lookup
  if v_org_id is null then
    v_invoice_id := coalesce((v_new ->> 'invoice_id')::uuid, (v_old ->> 'invoice_id')::uuid);
    if v_invoice_id is not null then
      select organization_id into v_org_id from public.invoices where id = v_invoice_id;
    end if;
  end if;

  -- 4. Prescription lookup (for prescription_items)
  if v_org_id is null then
    v_prescription_id := coalesce((v_new ->> 'prescription_id')::uuid, (v_old ->> 'prescription_id')::uuid);
    if v_prescription_id is not null then
      select p.organization_id into v_org_id
      from public.prescriptions rx
      join public.patients p on p.id = rx.patient_id
      where rx.id = v_prescription_id;
    end if;
  end if;

  -- Entity ID resolution: id first, fallback to encounter_id
  v_entity_id := coalesce(
    (v_new ->> 'id')::uuid,
    (v_old ->> 'id')::uuid,
    (v_new ->> 'encounter_id')::uuid,
    (v_old ->> 'encounter_id')::uuid
  );

  insert into public.audit_log (
    organization_id,
    actor_profile_id,
    action,
    entity_type,
    entity_id,
    before,
    after
  ) values (
    v_org_id,
    (select auth.uid()),
    lower(TG_OP),
    TG_TABLE_NAME,
    v_entity_id,
    v_old,
    v_new
  );

  return coalesce(NEW, OLD);
end;
$$;

-- =====================================================================
-- 2. Add prescription_items Audit Trigger
-- =====================================================================

drop trigger if exists trg_audit_prescription_items on public.prescription_items;
create trigger trg_audit_prescription_items
  after insert or update or delete on public.prescription_items
  for each row execute function private.audit_log();

-- =====================================================================
-- 3. Parent Prescriptions Completed-Encounter Immutability Trigger
-- =====================================================================

create or replace function private.check_prescription_encounter_immutability()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_old_status text;
  v_new_status text;
begin
  -- Case A: If prescription was already linked to an encounter (persisted OLD state)
  if OLD.encounter_id is not null then
    select status into v_old_status
    from public.clinical_encounters
    where id = OLD.encounter_id;

    if v_old_status = 'completed' then
      raise exception 'Prescriptions linked to a completed clinical encounter cannot be modified or deleted.';
    end if;
  end if;

  -- Case B: On UPDATE, if linking or changing to a new encounter
  if TG_OP = 'UPDATE' and NEW.encounter_id is not null and (OLD.encounter_id is null or OLD.encounter_id <> NEW.encounter_id) then
    select status into v_new_status
    from public.clinical_encounters
    where id = NEW.encounter_id;

    if v_new_status = 'completed' then
      raise exception 'Cannot link a prescription to a completed clinical encounter.';
    end if;
  end if;

  if TG_OP = 'DELETE' then
    return OLD;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_protect_completed_encounter_prescriptions on public.prescriptions;
create trigger trg_protect_completed_encounter_prescriptions
  before update or delete on public.prescriptions
  for each row execute function private.check_prescription_encounter_immutability();

-- =====================================================================
-- 4. Child Prescription Items Completed-Encounter Immutability Trigger
-- =====================================================================

create or replace function private.check_prescription_item_encounter_immutability()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_old_encounter_id uuid;
  v_old_encounter_status text;
  v_new_encounter_id uuid;
  v_new_encounter_status text;
begin
  -- Check parent prescription on INSERT
  if TG_OP = 'INSERT' then
    select rx.encounter_id, ce.status
    into v_new_encounter_id, v_new_encounter_status
    from public.prescriptions rx
    left join public.clinical_encounters ce on ce.id = rx.encounter_id
    where rx.id = NEW.prescription_id;

    if v_new_encounter_id is not null and v_new_encounter_status = 'completed' then
      raise exception 'Medicine items belonging to a prescription from a completed clinical encounter cannot be modified.';
    end if;

    return NEW;
  end if;

  -- Check parent prescription on DELETE
  if TG_OP = 'DELETE' then
    select rx.encounter_id, ce.status
    into v_old_encounter_id, v_old_encounter_status
    from public.prescriptions rx
    left join public.clinical_encounters ce on ce.id = rx.encounter_id
    where rx.id = OLD.prescription_id;

    if v_old_encounter_id is not null and v_old_encounter_status = 'completed' then
      raise exception 'Medicine items belonging to a prescription from a completed clinical encounter cannot be modified.';
    end if;

    return OLD;
  end if;

  -- Check parent prescription(s) on UPDATE
  if TG_OP = 'UPDATE' then
    -- 1. Check existing OLD parent
    select rx.encounter_id, ce.status
    into v_old_encounter_id, v_old_encounter_status
    from public.prescriptions rx
    left join public.clinical_encounters ce on ce.id = rx.encounter_id
    where rx.id = OLD.prescription_id;

    if v_old_encounter_id is not null and v_old_encounter_status = 'completed' then
      raise exception 'Medicine items belonging to a prescription from a completed clinical encounter cannot be modified.';
    end if;

    -- 2. If moving item to a different prescription, check NEW parent
    if NEW.prescription_id <> OLD.prescription_id then
      select rx.encounter_id, ce.status
      into v_new_encounter_id, v_new_encounter_status
      from public.prescriptions rx
      left join public.clinical_encounters ce on ce.id = rx.encounter_id
      where rx.id = NEW.prescription_id;

      if v_new_encounter_id is not null and v_new_encounter_status = 'completed' then
        raise exception 'Medicine items belonging to a prescription from a completed clinical encounter cannot be modified.';
      end if;
    end if;

    return NEW;
  end if;

  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists trg_protect_completed_encounter_prescription_items on public.prescription_items;
create trigger trg_protect_completed_encounter_prescription_items
  before insert or update or delete on public.prescription_items
  for each row execute function private.check_prescription_item_encounter_immutability();

-- =====================================================================
-- 5. Shared Atomic Clinical Prescription RPC
-- =====================================================================

create or replace function public.create_clinical_prescription(
  p_patient_id uuid,
  p_encounter_id uuid,
  p_notes text,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller_role text;
  v_caller_org_id uuid;
  v_caller_practitioner_id uuid;
  v_encounter record;
  v_patient_id uuid;
  v_appointment_id uuid;
  v_encounter_id uuid;
  v_notes text;
  v_item jsonb;
  v_medicine_name text;
  v_dosage text;
  v_frequency text;
  v_duration text;
  v_instructions text;
  v_prescription_id uuid;
  v_issued_at timestamptz;
  v_items_count int := 0;
begin
  -- 1. Authentication & Role Check
  v_caller_role := private.current_role();
  v_caller_org_id := private.current_org_id();
  v_caller_practitioner_id := private.current_practitioner_id();

  if v_caller_role is null or v_caller_org_id is null then
    raise exception 'Unauthorized: User is not authenticated';
  end if;

  if v_caller_role not in ('dentist', 'owner_admin') then
    raise exception 'Permission denied: Only clinicians can issue prescriptions';
  end if;

  if v_caller_practitioner_id is null then
    raise exception 'Clinician must have an active practitioner profile in the current organization to issue prescriptions';
  end if;

  if not private.practitioner_in_org(v_caller_practitioner_id) then
    raise exception 'Practitioner does not belong to the current organization';
  end if;

  -- 2. Mode Resolution & Trust Boundary Enforcement
  if p_encounter_id is not null then
    -- Encounter Mode: patientId must not be supplied by client
    if p_patient_id is not null then
      raise exception 'Invalid parameters: patientId must not be supplied when encounterId is present';
    end if;

    select *
    into v_encounter
    from public.clinical_encounters
    where id = p_encounter_id
      and organization_id = v_caller_org_id
    for update;

    if not found then
      raise exception 'Clinical encounter not found in current organization';
    end if;

    if v_encounter.status <> 'in_progress' then
      raise exception 'Cannot create prescription: Clinical encounter is not in progress';
    end if;

    if v_encounter.appointment_id is null then
      raise exception 'Cannot link prescription to encounter without a linked appointment';
    end if;

    -- Practitioner ownership check for dentist
    if v_caller_role = 'dentist' and v_encounter.practitioner_id <> v_caller_practitioner_id then
      raise exception 'Permission denied: Dentists may only issue prescriptions for their own clinical encounters';
    end if;

    v_patient_id := v_encounter.patient_id;
    v_appointment_id := v_encounter.appointment_id;
    v_encounter_id := v_encounter.id;

  else
    -- Standalone Mode: patientId is required and must belong to current org
    if p_patient_id is null then
      raise exception 'Invalid parameters: patientId is required for standalone prescriptions';
    end if;

    select id
    into v_patient_id
    from public.patients
    where id = p_patient_id
      and organization_id = v_caller_org_id;

    if not found then
      raise exception 'Patient not found in current organization';
    end if;

    v_appointment_id := null;
    v_encounter_id := null;
  end if;

  -- 3. Top-Level Items Validation
  if p_items is null then
    raise exception 'Prescription items are required';
  end if;

  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'Prescription items must be a JSON array';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Prescription must contain at least one medicine item';
  end if;

  -- 4. Notes Normalization
  v_notes := nullif(trim(p_notes), '');

  -- 5. Insert Parent Prescription Header
  insert into public.prescriptions (
    patient_id,
    appointment_id,
    practitioner_id,
    encounter_id,
    notes,
    status,
    issued_at,
    created_at
  ) values (
    v_patient_id,
    v_appointment_id,
    v_caller_practitioner_id,
    v_encounter_id,
    v_notes,
    'active',
    now(),
    now()
  )
  returning id, issued_at into v_prescription_id, v_issued_at;

  -- 6. Iterate, Validate & Insert Child Prescription Items
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(v_item) <> 'object' then
      raise exception 'Each prescription item must be a JSON object';
    end if;

    -- medicineName: required string
    if not (v_item ? 'medicineName') or jsonb_typeof(v_item -> 'medicineName') <> 'string' then
      raise exception 'Medicine name is required for all prescription items';
    end if;

    v_medicine_name := nullif(trim(v_item ->> 'medicineName'), '');
    if v_medicine_name is null then
      raise exception 'Medicine name is required for all prescription items';
    end if;

    -- dosage: optional string
    if (v_item ? 'dosage') and jsonb_typeof(v_item -> 'dosage') not in ('string', 'null') then
      raise exception 'Prescription item dosage must be text';
    end if;
    v_dosage := nullif(trim(v_item ->> 'dosage'), '');

    -- frequency: optional string
    if (v_item ? 'frequency') and jsonb_typeof(v_item -> 'frequency') not in ('string', 'null') then
      raise exception 'Prescription item frequency must be text';
    end if;
    v_frequency := nullif(trim(v_item ->> 'frequency'), '');

    -- duration: optional string
    if (v_item ? 'duration') and jsonb_typeof(v_item -> 'duration') not in ('string', 'null') then
      raise exception 'Prescription item duration must be text';
    end if;
    v_duration := nullif(trim(v_item ->> 'duration'), '');

    -- instructions: optional string
    if (v_item ? 'instructions') and jsonb_typeof(v_item -> 'instructions') not in ('string', 'null') then
      raise exception 'Prescription item instructions must be text';
    end if;
    v_instructions := nullif(trim(v_item ->> 'instructions'), '');

    insert into public.prescription_items (
      prescription_id,
      medicine_name,
      dosage,
      frequency,
      duration,
      instructions,
      created_at
    ) values (
      v_prescription_id,
      v_medicine_name,
      v_dosage,
      v_frequency,
      v_duration,
      v_instructions,
      now()
    );

    v_items_count := v_items_count + 1;
  end loop;

  -- 7. Return Structured Response
  return jsonb_build_object(
    'success', true,
    'prescription_id', v_prescription_id,
    'patient_id', v_patient_id,
    'encounter_id', v_encounter_id,
    'appointment_id', v_appointment_id,
    'items_count', v_items_count,
    'issued_at', v_issued_at
  );
end;
$$;

-- =====================================================================
-- 6. Privileges and Access Control
-- =====================================================================

revoke execute on function public.create_clinical_prescription(uuid, uuid, text, jsonb) from public, anon;
grant execute on function public.create_clinical_prescription(uuid, uuid, text, jsonb) to authenticated;
