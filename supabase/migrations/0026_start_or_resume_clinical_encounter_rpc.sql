-- ---------------------------------------------------------------------
-- 0026_start_or_resume_clinical_encounter_rpc.sql
-- Phase 5C.2: Atomic Start / Resume Clinical Encounter RPC
-- ---------------------------------------------------------------------
-- 1. Atomically creates a new clinical encounter OR resumes/returns an existing one.
-- 2. Concurrently serializes on exclusive appointment row-level lock (FOR UPDATE).
-- 3. Derives patient, practitioner, and tenant identity trusted from the appointment.
-- 4. Seamlessly transitions 'confirmed' appointments to 'checked_in' upon consultation start.
-- 5. Preserves role authorization, uniqueness constraints, and immutability triggers.
-- ---------------------------------------------------------------------

create or replace function public.start_or_resume_clinical_encounter(
  p_appointment_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller_role text;
  v_caller_org_id uuid;
  v_caller_practitioner_id uuid;
  v_appointment record;
  v_encounter record;
  v_new_encounter_id uuid;
  v_now timestamptz := clock_timestamp();
  v_appt_status text;
begin
  -- 1. Authentication & Role Authorization
  v_caller_role := private.current_role();
  v_caller_org_id := private.current_org_id();

  if v_caller_role is null or v_caller_org_id is null then
    raise exception 'Unauthorized: User is not authenticated';
  end if;

  if v_caller_role not in ('dentist', 'owner_admin') then
    raise exception 'Permission denied: Only clinicians can start or resume clinical encounters';
  end if;

  if p_appointment_id is null then
    raise exception 'Appointment ID is required';
  end if;

  -- 2. Concurrency Control & Trust Boundary: Lock Appointment Row
  select *
  into v_appointment
  from public.appointments
  where id = p_appointment_id
    and organization_id = v_caller_org_id
  for update;

  if not found then
    raise exception 'Appointment not found in current organization';
  end if;

  -- 3. Practitioner Scoping Check
  if v_caller_role = 'dentist' then
    v_caller_practitioner_id := private.current_practitioner_id();
    if v_caller_practitioner_id is null or v_appointment.practitioner_id != v_caller_practitioner_id then
      raise exception 'Permission denied: Dentist can only start or resume encounters for their own appointments';
    end if;
  elsif v_caller_role = 'owner_admin' then
    if not private.practitioner_in_org(v_appointment.practitioner_id) then
      raise exception 'Practitioner does not belong to the current organization';
    end if;
  end if;

  -- 4. Check for Existing Clinical Encounter
  select *
  into v_encounter
  from public.clinical_encounters
  where appointment_id = v_appointment.id
    and organization_id = v_caller_org_id;

  v_appt_status := v_appointment.status;

  if found then
    -- Encounter Already Exists: Branch by Status
    if v_encounter.status = 'in_progress' then
      if v_appt_status not in ('confirmed', 'checked_in') then
        raise exception 'Cannot resume encounter: Inconsistent appointment status % (expected confirmed or checked_in)', v_appt_status;
      end if;

      -- If appointment is still 'confirmed', advance to 'checked_in'
      if v_appt_status = 'confirmed' then
        update public.appointments
        set
          status = 'checked_in',
          updated_at = v_now
        where id = v_appointment.id;
        v_appt_status := 'checked_in';
      end if;

      return jsonb_build_object(
        'success', true,
        'encounter_id', v_encounter.id,
        'encounter_status', 'in_progress',
        'appointment_id', v_appointment.id,
        'appointment_status', v_appt_status,
        'mode', 'resumed'
      );

    elsif v_encounter.status = 'completed' then
      if v_appt_status != 'completed' then
        raise exception 'Cannot open completed encounter: Inconsistent appointment status % (expected completed)', v_appt_status;
      end if;

      return jsonb_build_object(
        'success', true,
        'encounter_id', v_encounter.id,
        'encounter_status', 'completed',
        'appointment_id', v_appointment.id,
        'appointment_status', v_appt_status,
        'mode', 'readonly'
      );

    elsif v_encounter.status = 'cancelled' then
      raise exception 'Cannot resume or restart a cancelled clinical encounter';
    else
      raise exception 'Unknown clinical encounter status: %', v_encounter.status;
    end if;

  else
    -- No Existing Encounter: Validate Appointment Eligibility
    if v_appt_status not in ('confirmed', 'checked_in') then
      raise exception 'Cannot start consultation: Appointment status is % (must be confirmed or checked_in)', v_appt_status;
    end if;

    -- Advance 'confirmed' to 'checked_in'
    if v_appt_status = 'confirmed' then
      update public.appointments
      set
        status = 'checked_in',
        updated_at = v_now
      where id = v_appointment.id;
      v_appt_status := 'checked_in';
    end if;

    -- Create New Clinical Encounter
    v_new_encounter_id := gen_random_uuid();

    insert into public.clinical_encounters (
      id,
      organization_id,
      patient_id,
      practitioner_id,
      appointment_id,
      status,
      started_at,
      created_at,
      updated_at
    ) values (
      v_new_encounter_id,
      v_appointment.organization_id,
      v_appointment.patient_id,
      v_appointment.practitioner_id,
      v_appointment.id,
      'in_progress',
      v_now,
      v_now,
      v_now
    );

    return jsonb_build_object(
      'success', true,
      'encounter_id', v_new_encounter_id,
      'encounter_status', 'in_progress',
      'appointment_id', v_appointment.id,
      'appointment_status', v_appt_status,
      'mode', 'started'
    );
  end if;
end;
$$;

-- Explicit privilege lockdown: only authenticated clinicians may execute
revoke all on function public.start_or_resume_clinical_encounter(uuid) from public;
revoke all on function public.start_or_resume_clinical_encounter(uuid) from anon;
grant execute on function public.start_or_resume_clinical_encounter(uuid) to authenticated;
