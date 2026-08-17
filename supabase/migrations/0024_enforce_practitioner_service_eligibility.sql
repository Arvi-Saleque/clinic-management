-- ---------------------------------------------------------------------
-- 0024_enforce_practitioner_service_eligibility.sql
-- Phase 4B.1: Enforce that get_available_slots and book_appointment
-- require an active practitioner_services relationship for the doctor.
-- ---------------------------------------------------------------------

-- 1. Update public.get_available_slots to require practitioner_services
create or replace function public.get_available_slots(
  p_practitioner_id uuid,
  p_service_id uuid,
  p_date date
) returns table (slot_start timestamptz, slot_end timestamptz)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_duration int;
  v_dow smallint := extract(dow from p_date);
  v_tz text;
  v_rule record;
  v_grid_start timestamptz;
  v_grid_end timestamptz;
  v_cursor timestamptz;
  v_step interval := interval '15 minutes';
begin
  -- Require that the practitioner actively offers this service
  select coalesce(ps.override_duration_minutes, s.duration_minutes)
    into v_duration
  from public.services s
  join public.practitioner_services ps
    on ps.service_id = s.id and ps.practitioner_id = p_practitioner_id
  where s.id = p_service_id
    and s.is_active = true;

  if v_duration is null then
    return;
  end if;

  select b.timezone into v_tz
  from public.practitioners p join public.branches b on b.id = p.branch_id
  where p.id = p_practitioner_id
    and p.is_bookable = true;

  if v_tz is null then
    return;
  end if;

  -- Full-day exception (leave/holiday) blocks everything.
  if exists (
    select 1 from public.availability_exceptions
    where practitioner_id = p_practitioner_id and date = p_date
      and is_unavailable = true and start_time is null
  ) then
    return;
  end if;

  for v_rule in
    select start_time, end_time from public.availability_rules
    where practitioner_id = p_practitioner_id
      and day_of_week = v_dow
      and effective_from <= p_date
      and (effective_to is null or effective_to >= p_date)
  loop
    v_grid_start := (p_date::text || ' ' || v_rule.start_time::text)::timestamp at time zone v_tz;
    v_grid_end := (p_date::text || ' ' || v_rule.end_time::text)::timestamp at time zone v_tz;
    v_cursor := v_grid_start;

    while v_cursor + (v_duration || ' minutes')::interval <= v_grid_end loop
      if not exists (
        -- partial-day exception overlap
        select 1 from public.availability_exceptions ae
        where ae.practitioner_id = p_practitioner_id
          and ae.date = p_date
          and ae.is_unavailable = true
          and ae.start_time is not null
          and tstzrange(
                (p_date::text || ' ' || ae.start_time::text)::timestamp at time zone v_tz,
                (p_date::text || ' ' || ae.end_time::text)::timestamp at time zone v_tz
              ) && tstzrange(v_cursor, v_cursor + (v_duration || ' minutes')::interval)
      ) and not exists (
        -- existing booking overlap (only status that still holds the slot)
        select 1 from public.appointments a
        where a.practitioner_id = p_practitioner_id
          and a.status not in ('cancelled', 'no_show')
          and tstzrange(a.starts_at, a.ends_at) && tstzrange(v_cursor, v_cursor + (v_duration || ' minutes')::interval)
      ) and v_cursor > now() then
        slot_start := v_cursor;
        slot_end := v_cursor + (v_duration || ' minutes')::interval;
        return next;
      end if;

      v_cursor := v_cursor + v_step;
    end loop;
  end loop;
end;
$$;

revoke execute on function public.get_available_slots(uuid, uuid, date) from public;
grant execute on function public.get_available_slots(uuid, uuid, date) to anon, authenticated;

-- 2. Update public.book_appointment to explicitly verify practitioner_services and branch/tenant integrity
create or replace function public.book_appointment(
  p_practitioner_id uuid,
  p_service_id uuid,
  p_branch_id uuid,
  p_patient_id uuid,
  p_starts_at timestamptz,
  p_booking_source text,
  p_notes text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_duration int;
  v_ends_at timestamptz;
  v_new_id uuid;
  v_service_org_id uuid;
  v_practitioner_branch_id uuid;
  v_practitioner_org_id uuid;
  v_patient_org_id uuid;
begin
  if p_booking_source = 'online' then
    if p_patient_id is distinct from private.current_patient_id() then
      raise exception 'A patient may only book an appointment for themselves';
    end if;
  else
    if not private.is_staff() then
      raise exception 'Only clinic staff may create staff/phone bookings';
    end if;
  end if;

  -- 1. Verify service is active and offered by this practitioner
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

  -- 2. Resolve practitioner canonical branch and organization
  select p.branch_id, b.organization_id
    into v_practitioner_branch_id, v_practitioner_org_id
  from public.practitioners p
  join public.branches b on b.id = p.branch_id
  where p.id = p_practitioner_id
    and p.is_bookable = true;

  if v_practitioner_branch_id is null then
    raise exception 'Practitioner is not available for booking or does not exist';
  end if;

  -- 3. Enforce staff caller belongs to the practitioner's organization
  if p_booking_source <> 'online' then
    if private.current_org_id() is distinct from v_practitioner_org_id then
      raise exception 'Staff member does not belong to the target clinic organization';
    end if;
  end if;

  -- 4. Enforce service and practitioner share the same organization
  if v_service_org_id is distinct from v_practitioner_org_id then
    raise exception 'Service and practitioner belong to different organizations';
  end if;

  -- 5. Resolve and validate patient organization
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

  -- 6. Validate caller-supplied branch argument against canonical branch
  if p_branch_id is distinct from v_practitioner_branch_id then
    raise exception 'Provided branch does not match the practitioner assigned branch';
  end if;

  -- 6. Calculate end time and revalidate slot availability
  v_ends_at := p_starts_at + (v_duration || ' minutes')::interval;

  if not exists (
    select 1 from public.get_available_slots(p_practitioner_id, p_service_id, p_starts_at::date)
    where slot_start = p_starts_at
  ) then
    raise exception 'That time is no longer available — please pick another slot';
  end if;

  -- 7. Insert appointment using ONLY authoritative database-derived organization and branch
  insert into public.appointments (
    organization_id, branch_id, patient_id, practitioner_id, service_id,
    starts_at, ends_at, status, booking_source, created_by_profile_id, notes
  ) values (
    v_practitioner_org_id, v_practitioner_branch_id, p_patient_id, p_practitioner_id, p_service_id,
    p_starts_at, v_ends_at, 'confirmed', p_booking_source, (select auth.uid()), p_notes
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

revoke execute on function public.book_appointment(uuid, uuid, uuid, uuid, timestamptz, text, text) from public;
revoke execute on function public.book_appointment(uuid, uuid, uuid, uuid, timestamptz, text, text) from anon;
grant execute on function public.book_appointment(uuid, uuid, uuid, uuid, timestamptz, text, text) to authenticated;
