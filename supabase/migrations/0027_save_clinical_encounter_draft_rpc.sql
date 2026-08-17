-- ---------------------------------------------------------------------
-- 0027_save_clinical_encounter_draft_rpc.sql
-- Phase 5E.2: Atomic Clinical Encounter Draft Save RPC
-- ---------------------------------------------------------------------
-- 1. Atomically updates an in-progress clinical encounter draft snapshot.
-- 2. Concurrently locks the target encounter row (SELECT ... FOR UPDATE).
-- 3. Synchronizes private clinician notes within the same transaction
--    (upserts if text present, deletes if blank/null).
-- 4. Enforces strict boolean/date consistency for follow-up plans.
-- 5. Preserves role authorization, tenant scoping, and encounter immutability.
-- 6. Never alters appointment state, encounter status, or timestamps other than updated_at.
-- ---------------------------------------------------------------------

create or replace function public.save_clinical_encounter_draft(
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
  v_now timestamptz;
  v_trimmed_private_notes text;
  v_final_chief_complaint text;
  v_final_diagnosis text;
  v_final_performed_treatment text;
  v_final_patient_notes text;
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
    raise exception 'Permission denied: Only clinicians can save clinical encounter drafts';
  end if;

  if p_encounter_id is null then
    raise exception 'Encounter ID is required';
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
    raise exception 'Cannot save draft: Encounter status is % (expected in_progress)', v_encounter.status;
  end if;

  if v_caller_role = 'dentist' then
    v_caller_practitioner_id := private.current_practitioner_id();
    if v_caller_practitioner_id is null or v_encounter.practitioner_id != v_caller_practitioner_id then
      raise exception 'Permission denied: Dentist can only save drafts for their own clinical encounters';
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

  -- 5. Text Normalization
  v_final_chief_complaint := nullif(trim(p_chief_complaint), '');
  v_final_diagnosis := nullif(trim(p_diagnosis), '');
  v_final_performed_treatment := nullif(trim(p_performed_treatment), '');
  v_final_patient_notes := nullif(trim(p_patient_notes), '');
  v_trimmed_private_notes := nullif(trim(p_private_notes), '');

  -- 6. Lock-Synchronized Timestamp Assignment
  v_now := clock_timestamp();

  -- 7. Private Clinician Notes Synchronization
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

  -- 8. Update Encounter Draft Fields Only
  update public.clinical_encounters
  set
    chief_complaint = v_final_chief_complaint,
    diagnosis = v_final_diagnosis,
    performed_treatment = v_final_performed_treatment,
    patient_notes = v_final_patient_notes,
    follow_up_recommended = p_follow_up_recommended,
    follow_up_date = v_final_follow_up_date,
    follow_up_reason = v_final_follow_up_reason,
    updated_at = v_now
  where id = v_encounter.id;

  -- 9. Return Confirmation Payload
  return jsonb_build_object(
    'success', true,
    'encounter_id', v_encounter.id,
    'status', 'in_progress',
    'updated_at', v_now
  );
end;
$$;

-- ---------------------------------------------------------------------
-- Function Grants & Privileges
-- ---------------------------------------------------------------------

revoke all on function public.save_clinical_encounter_draft(
  uuid,
  text,
  text,
  text,
  text,
  text,
  boolean,
  date,
  text
) from public, anon;

grant execute on function public.save_clinical_encounter_draft(
  uuid,
  text,
  text,
  text,
  text,
  text,
  boolean,
  date,
  text
) to authenticated;
