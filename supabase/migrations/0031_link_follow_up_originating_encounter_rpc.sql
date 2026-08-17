-- ---------------------------------------------------------------------
-- 0031_link_follow_up_originating_encounter_rpc.sql
-- Phase 5J.3-A: Link Follow-Up Appointments to Originating Clinical Encounters
-- ---------------------------------------------------------------------
-- 1. Explicitly drops the legacy 7-parameter `public.book_appointment` function
--    to prevent ambiguous PostgREST / Supabase RPC overloads.
-- 2. Re-implements `public.book_appointment` with `p_originating_encounter_id uuid default null`.
-- 3. Preserves ALL existing booking, slot availability, duration, tenant,
--    practitioner eligibility, and anti-overlap validations from migration 0024.
-- 4. When `p_originating_encounter_id` is supplied:
--    - Enforces that caller is a clinician (`dentist` or `owner_admin`).
--    - Locks the originating encounter (`FOR SHARE`) and verifies tenant organization scoping.
--    - Enforces encounter status is 'completed'.
--    - Enforces strict patient identity and same-practitioner continuity required
--      by `appointments_originating_encounter_fk`.
--    - When caller is 'dentist', strictly enforces caller is the treating practitioner
--      who authored the originating clinical encounter.
-- 5. Writes `originating_encounter_id` to `public.appointments`.
-- ---------------------------------------------------------------------

-- =====================================================================
-- 1. Drop Legacy 7-Parameter RPC Signature
-- =====================================================================

drop function if exists public.book_appointment(
  uuid,
  uuid,
  uuid,
  uuid,
  timestamptz,
  text,
  text
);

-- =====================================================================
-- 2. Re-create Authoritative 8-Parameter RPC Function
-- =====================================================================

create or replace function public.book_appointment(
  p_practitioner_id uuid,
  p_service_id uuid,
  p_branch_id uuid,
  p_patient_id uuid,
  p_starts_at timestamptz,
  p_booking_source text,
  p_notes text default null,
  p_originating_encounter_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller_role text;
  v_caller_practitioner_id uuid;
  v_duration int;
  v_ends_at timestamptz;
  v_new_id uuid;
  v_service_org_id uuid;
  v_practitioner_branch_id uuid;
  v_practitioner_org_id uuid;
  v_patient_org_id uuid;
  v_originating_encounter record;
begin
  v_caller_role := private.current_role();

  -- 1. Caller Authorization & Booking Source Verification
  if p_booking_source = 'online' then
    if p_patient_id is distinct from private.current_patient_id() then
      raise exception 'A patient may only book an appointment for themselves';
    end if;
  else
    if not private.is_staff() then
      raise exception 'Only clinic staff may create staff/phone bookings';
    end if;
  end if;

  -- 2. Originating Encounter Role Restriction
  if p_originating_encounter_id is not null then
    if v_caller_role not in ('dentist', 'owner_admin') then
      raise exception 'Permission denied: Only clinicians can schedule a follow-up from a clinical encounter';
    end if;
  end if;

  -- 3. Verify service is active and offered by this practitioner
  select coalesce(ps.override_duration_minutes, s.duration_minutes), s.organization_id
    into v_duration, v_service_org_id
  from public.services s
  join public.practitioner_services ps
    on ps.service_id = s.id and ps.practitioner_id = p_practitioner_id
  where s.id = p_service_id
    and s.is_active = true;

  if v_duration is null then
    raise exception 'The selected practitioner does not offer this service or the service is inactive';
  end if;

  -- 4. Resolve practitioner canonical branch and organization
  select p.branch_id, b.organization_id
    into v_practitioner_branch_id, v_practitioner_org_id
  from public.practitioners p
  join public.branches b on b.id = p.branch_id
  where p.id = p_practitioner_id
    and p.is_bookable = true;

  if v_practitioner_branch_id is null then
    raise exception 'Practitioner is not available for booking or does not exist';
  end if;

  -- 5. Enforce staff caller belongs to the practitioner's organization
  if p_booking_source <> 'online' then
    if private.current_org_id() is distinct from v_practitioner_org_id then
      raise exception 'Staff member does not belong to the target clinic organization';
    end if;
  end if;

  -- 6. Enforce service and practitioner share the same organization
  if v_service_org_id is distinct from v_practitioner_org_id then
    raise exception 'Service and practitioner belong to different organizations';
  end if;

  -- 7. Resolve and validate patient organization
  select p.organization_id
    into v_patient_org_id
  from public.patients p
  where p.id = p_patient_id;

  if v_patient_org_id is null then
    raise exception 'Patient not found';
  end if;

  if v_patient_org_id is distinct from v_practitioner_org_id then
    raise exception 'Patient and practitioner belong to different organizations';
  end if;

  -- 8. Validate caller-supplied branch argument against canonical branch
  if p_branch_id is distinct from v_practitioner_branch_id then
    raise exception 'Provided branch does not match the practitioner assigned branch';
  end if;

  -- 9. Originating Encounter Validation (when linking a follow-up)
  if p_originating_encounter_id is not null then
    select *
    into v_originating_encounter
    from public.clinical_encounters
    where id = p_originating_encounter_id
      and organization_id = v_practitioner_org_id
    for share;

    if not found then
      raise exception 'Originating clinical encounter not found in current organization';
    end if;

    if v_originating_encounter.status <> 'completed' then
      raise exception 'Cannot schedule follow-up: Originating clinical encounter is not completed';
    end if;

    if v_originating_encounter.patient_id <> p_patient_id then
      raise exception 'Cannot schedule follow-up: Patient mismatch with originating encounter';
    end if;

    if v_originating_encounter.practitioner_id <> p_practitioner_id then
      raise exception 'Cannot schedule follow-up: Follow-up appointments must be booked with the originating encounter practitioner';
    end if;

    -- Enforce dentist caller owns the originating clinical encounter
    if v_caller_role = 'dentist' then
      v_caller_practitioner_id := private.current_practitioner_id();
      if v_caller_practitioner_id is null or v_originating_encounter.practitioner_id <> v_caller_practitioner_id then
        raise exception 'Permission denied: Dentists may only schedule follow-ups from their own clinical encounters';
      end if;
    end if;
  end if;

  -- 10. Calculate end time and revalidate slot availability
  v_ends_at := p_starts_at + (v_duration || ' minutes')::interval;

  if not exists (
    select 1 from public.get_available_slots(p_practitioner_id, p_service_id, p_starts_at::date)
    where slot_start = p_starts_at
  ) then
    raise exception 'That time is no longer available — please pick another slot';
  end if;

  -- 11. Insert appointment with authoritative derived data & originating encounter link
  insert into public.appointments (
    organization_id,
    branch_id,
    patient_id,
    practitioner_id,
    service_id,
    starts_at,
    ends_at,
    status,
    booking_source,
    created_by_profile_id,
    notes,
    originating_encounter_id
  ) values (
    v_practitioner_org_id,
    v_practitioner_branch_id,
    p_patient_id,
    p_practitioner_id,
    p_service_id,
    p_starts_at,
    v_ends_at,
    'confirmed',
    p_booking_source,
    (select auth.uid()),
    p_notes,
    p_originating_encounter_id
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

-- =====================================================================
-- 3. Privileges and Access Control
-- =====================================================================

revoke execute on function public.book_appointment(uuid, uuid, uuid, uuid, timestamptz, text, text, uuid) from public;
revoke execute on function public.book_appointment(uuid, uuid, uuid, uuid, timestamptz, text, text, uuid) from anon;
grant execute on function public.book_appointment(uuid, uuid, uuid, uuid, timestamptz, text, text, uuid) to authenticated;
