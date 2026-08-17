-- ---------------------------------------------------------------------
-- 0025_complete_clinical_encounter_rpc.sql
-- Phase 5B.5: Atomic Clinical Encounter & Appointment Completion RPC
-- ---------------------------------------------------------------------
-- 1. Atomically commits clinical encounter final snapshot, status, and completion timestamp.
-- 2. Concurrently locks target encounter and linked appointment rows.
-- 3. Synchronizes private clinician notes (upsert if present, delete if cleared)
--    BEFORE locking the encounter into completed state.
-- 4. Atomically transitions linked appointment status from 'checked_in' to 'completed'.
-- 5. Preserves encounter immutability triggers and multi-tenant security boundaries.
-- ---------------------------------------------------------------------

create or replace function public.complete_clinical_encounter(
  p_encounter_id uuid,
  p_chief_complaint text,
  p_diagnosis text,
  p_performed_treatment text,
  p_patient_notes text,
  p_private_notes text,
  p_follow_up_recommended boolean,
  p_follow_up_date date,
  p_follow_up_reason text
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
  v_appointment record;
  v_now timestamptz := clock_timestamp();
  v_trimmed_private_notes text;
  v_final_follow_up_date date;
  v_final_follow_up_reason text;
begin
  -- 1. Authentication & Role Authorization
  v_caller_role := private.current_role();
  v_caller_org_id := private.current_org_id();

  if v_caller_role is null or v_caller_org_id is null then
    raise exception 'Unauthorized: User is not authenticated';
  end if;

  if v_caller_role not in ('dentist', 'owner_admin') then
    raise exception 'Permission denied: Only clinicians can complete clinical encounters';
  end if;

  -- 2. Concurrency Control: Acquire exclusive row-level lock on target encounter
  select *
  into v_encounter
  from public.clinical_encounters
  where id = p_encounter_id
    and organization_id = v_caller_org_id
  for update;

  if not found then
    raise exception 'Clinical encounter not found in current organization';
  end if;

  -- 3. Status and Practitioner Scoping Check
  if v_encounter.status != 'in_progress' then
    raise exception 'Cannot complete encounter: Status is already %', v_encounter.status;
  end if;

  if v_caller_role = 'dentist' then
    v_caller_practitioner_id := private.current_practitioner_id();
    if v_caller_practitioner_id is null or v_encounter.practitioner_id != v_caller_practitioner_id then
      raise exception 'Permission denied: Dentist can only complete their own clinical encounters';
    end if;
  elsif v_caller_role = 'owner_admin' then
    if not private.practitioner_in_org(v_encounter.practitioner_id) then
      raise exception 'Practitioner does not belong to the current organization';
    end if;
  end if;

  -- 4. Follow-up Structural Consistency
  if p_follow_up_recommended is null then
    raise exception 'Follow-up recommended must be explicitly true or false';
  end if;

  if p_follow_up_recommended = true then
    if p_follow_up_date is null then
      raise exception 'Follow-up date is required when follow-up is recommended';
    end if;
    v_final_follow_up_date := p_follow_up_date;
    v_final_follow_up_reason := nullif(trim(p_follow_up_reason), '');
  else
    v_final_follow_up_date := null;
    v_final_follow_up_reason := null;
  end if;

  -- 5. Lock and Validate Linked Appointment (if present)
  if v_encounter.appointment_id is not null then
    select *
    into v_appointment
    from public.appointments
    where id = v_encounter.appointment_id
      and organization_id = v_caller_org_id
    for update;

    if not found then
      raise exception 'Linked appointment not found in current organization';
    end if;

    if v_appointment.patient_id != v_encounter.patient_id
       or v_appointment.practitioner_id != v_encounter.practitioner_id then
      raise exception 'Linked appointment mismatch with encounter patient or practitioner';
    end if;

    if v_appointment.status != 'checked_in' then
      raise exception 'Appointment must be checked in before completing the consultation (current status: %)', v_appointment.status;
    end if;
  end if;

  -- 6. Private Clinician Notes Synchronization (while encounter is still 'in_progress')
  v_trimmed_private_notes := nullif(trim(p_private_notes), '');

  if v_trimmed_private_notes is not null then
    insert into public.clinical_encounter_private_notes (
      encounter_id,
      organization_id,
      clinical_notes,
      created_at,
      updated_at
    ) values (
      v_encounter.id,
      v_encounter.organization_id,
      v_trimmed_private_notes,
      v_now,
      v_now
    )
    on conflict (encounter_id) do update set
      clinical_notes = EXCLUDED.clinical_notes,
      updated_at = v_now;
  else
    delete from public.clinical_encounter_private_notes
    where encounter_id = v_encounter.id;
  end if;

  -- 7. Finalize Clinical Encounter State
  update public.clinical_encounters
  set
    chief_complaint = nullif(trim(p_chief_complaint), ''),
    diagnosis = nullif(trim(p_diagnosis), ''),
    performed_treatment = nullif(trim(p_performed_treatment), ''),
    patient_notes = nullif(trim(p_patient_notes), ''),
    follow_up_recommended = p_follow_up_recommended,
    follow_up_date = v_final_follow_up_date,
    follow_up_reason = v_final_follow_up_reason,
    status = 'completed',
    completed_at = v_now,
    updated_at = v_now
  where id = v_encounter.id;

  -- 8. Finalize Linked Appointment State
  if v_encounter.appointment_id is not null then
    update public.appointments
    set
      status = 'completed',
      updated_at = v_now
    where id = v_encounter.appointment_id;
  end if;

  return jsonb_build_object(
    'success', true,
    'encounter_id', v_encounter.id,
    'appointment_id', v_encounter.appointment_id,
    'status', 'completed',
    'completed_at', v_now
  );
end;
$$;

-- Explicit privilege lockdown: only authenticated clinicians may execute
revoke all on function public.complete_clinical_encounter(uuid, text, text, text, text, text, boolean, date, text) from public;
revoke all on function public.complete_clinical_encounter(uuid, text, text, text, text, text, boolean, date, text) from anon;
grant execute on function public.complete_clinical_encounter(uuid, text, text, text, text, text, boolean, date, text) to authenticated;
