-- ---------------------------------------------------------------------
-- 0029_atomic_odontogram_charting_rpc.sql
-- Phase 5H.4-B: Atomic Odontogram Charting RPC & Current-State Integrity
-- ---------------------------------------------------------------------
-- 1. Deduplicates existing active tooth records (retaining newest recorded_at).
-- 2. Creates a partial UNIQUE index on (patient_id, tooth_number) WHERE is_current = true.
-- 3. Provides atomic public.chart_patient_tooth(...) RPC for both standalone
--    and encounter consultation charting workflows.
-- 4. Serializes tooth writes via transaction-scoped advisory locks.
-- 5. Enforces clinician authorization and practitioner attribution.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- 1. Deduplicate Existing Active Tooth Entries
-- ---------------------------------------------------------------------

with ranked_entries as (
  select
    id,
    row_number() over (
      partition by patient_id, tooth_number
      order by recorded_at desc, id desc
    ) as rn
  from public.odontogram_entries
  where is_current = true
)
update public.odontogram_entries
set is_current = false
where id in (
  select id from ranked_entries where rn > 1
);

-- ---------------------------------------------------------------------
-- 2. Partial Unique Index for Single Current State per Tooth
-- ---------------------------------------------------------------------

create unique index if not exists odontogram_entries_patient_tooth_current_uidx
  on public.odontogram_entries (patient_id, tooth_number)
  where (is_current = true);

-- ---------------------------------------------------------------------
-- 3. Atomic Odontogram Charting RPC
-- ---------------------------------------------------------------------

create or replace function public.chart_patient_tooth(
  p_patient_id uuid,
  p_encounter_id uuid,
  p_tooth_number text,
  p_status text,
  p_condition_code text,
  p_condition_note text,
  p_recommended_treatment text,
  p_treatment_priority text,
  p_planned_date date,
  p_estimated_fee numeric
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller_role text;
  v_caller_org_id uuid;
  v_caller_practitioner_id uuid;
  v_patient_id uuid;
  v_appointment_id uuid;
  v_encounter record;
  v_tooth_number text;
  v_condition_code text;
  v_condition_note text;
  v_recommended_treatment text;
  v_treatment_priority text;
  v_now timestamptz;
  v_new_entry_id uuid;
begin
  -- 1. Authentication & Role Check
  v_caller_role := private.current_role();
  v_caller_org_id := private.current_org_id();
  v_caller_practitioner_id := private.current_practitioner_id();

  if v_caller_role is null or v_caller_org_id is null then
    raise exception 'Unauthorized: User is not authenticated';
  end if;

  if v_caller_role not in ('dentist', 'owner_admin') then
    raise exception 'Permission denied: Only clinicians can record dental charts';
  end if;

  if v_caller_practitioner_id is null then
    raise exception 'Clinician must have an active practitioner profile in the current organization to record dental charts';
  end if;

  if not private.practitioner_in_org(v_caller_practitioner_id) then
    raise exception 'Practitioner does not belong to the current organization';
  end if;

  -- 2. Mode Resolution & Trust Boundary Enforcement
  if p_encounter_id is not null then
    -- Encounter Mode: Lock and derive trusted encounter relationships
    select *
    into v_encounter
    from public.clinical_encounters
    where id = p_encounter_id
      and organization_id = v_caller_org_id
    for update;

    if not found then
      raise exception 'Clinical encounter not found in current organization';
    end if;

    if v_encounter.status != 'in_progress' then
      raise exception 'Cannot chart teeth: Clinical encounter is not in progress';
    end if;

    if v_caller_role = 'dentist' and v_encounter.practitioner_id != v_caller_practitioner_id then
      raise exception 'Permission denied: Dentist can only chart teeth for their own clinical encounters';
    end if;

    v_patient_id := v_encounter.patient_id;
    v_appointment_id := v_encounter.appointment_id;

    if p_patient_id is not null and p_patient_id != v_patient_id then
      raise exception 'Patient ID mismatch with encounter';
    end if;

    -- Enforce DB composite constraint: encounter-linked odontogram requires linked appointment
    if v_appointment_id is null then
      raise exception 'Cannot link odontogram entry to encounter without a linked appointment';
    end if;
  else
    -- Standalone Mode: Patient must be provided explicitly and scoped to current org
    if p_patient_id is null then
      raise exception 'Patient ID is required for standalone dental charting';
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
  end if;

  -- 3. Input Normalization & Validation
  v_tooth_number := trim(p_tooth_number);
  if v_tooth_number is null or v_tooth_number = '' then
    raise exception 'Tooth number is required';
  end if;

  -- Restrict to the 32 permanent adult teeth supported by the application
  if v_tooth_number not in (
    '11','12','13','14','15','16','17','18',
    '21','22','23','24','25','26','27','28',
    '31','32','33','34','35','36','37','38',
    '41','42','43','44','45','46','47','48'
  ) then
    raise exception 'Invalid tooth number format';
  end if;

  if p_status is null
     or p_status not in (
       'healthy',
       'existing_treatment',
       'planned_treatment',
       'completed_treatment',
       'missing',
       'other'
     )
  then
    raise exception 'Invalid tooth status';
  end if;

  v_treatment_priority := nullif(trim(p_treatment_priority), '');
  if v_treatment_priority is not null and v_treatment_priority not in ('routine', 'priority', 'urgent') then
    raise exception 'Invalid treatment priority';
  end if;

  if p_estimated_fee is not null and p_estimated_fee < 0 then
    raise exception 'Estimated fee must not be negative';
  end if;

  v_condition_code := nullif(trim(p_condition_code), '');
  v_condition_note := nullif(trim(p_condition_note), '');
  v_recommended_treatment := nullif(trim(p_recommended_treatment), '');

  -- 4. Fine-Grained Advisory Lock: Serialize writes for (patient_id, tooth_number)
  perform pg_advisory_xact_lock(hashtext(v_patient_id::text), hashtext(v_tooth_number));

  v_now := clock_timestamp();

  -- 5. Atomic State Transition: Deactivate prior current entries for this tooth
  update public.odontogram_entries
  set is_current = false
  where patient_id = v_patient_id
    and tooth_number = v_tooth_number
    and is_current = true;

  -- 6. Insert New Active State Entry
  insert into public.odontogram_entries (
    patient_id,
    chart_type,
    tooth_number,
    surface,
    status,
    condition_code,
    condition_note,
    recommended_treatment,
    treatment_priority,
    planned_date,
    estimated_fee,
    recorded_by_practitioner_id,
    appointment_id,
    encounter_id,
    recorded_at,
    is_current
  ) values (
    v_patient_id,
    'adult',
    v_tooth_number,
    null,
    p_status,
    v_condition_code,
    v_condition_note,
    v_recommended_treatment,
    v_treatment_priority,
    p_planned_date,
    p_estimated_fee,
    v_caller_practitioner_id,
    v_appointment_id,
    p_encounter_id,
    v_now,
    true
  )
  returning id into v_new_entry_id;

  -- 7. Return Confirmation Snapshot
  return jsonb_build_object(
    'success', true,
    'entry_id', v_new_entry_id,
    'patient_id', v_patient_id,
    'tooth_number', v_tooth_number,
    'status', p_status,
    'encounter_id', p_encounter_id,
    'appointment_id', v_appointment_id,
    'is_current', true,
    'recorded_at', v_now
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 4. Function Grants & Privileges
-- ---------------------------------------------------------------------

revoke all on function public.chart_patient_tooth(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  date,
  numeric
) from public, anon;

grant execute on function public.chart_patient_tooth(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  date,
  numeric
) to authenticated;
