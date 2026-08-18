-- ---------------------------------------------------------------------
-- 0033_authoritative_date_availability_overrides.sql
-- Phase 2: Authoritative Date-Specific Availability Overrides & Slot Engine
-- ---------------------------------------------------------------------

-- 1. Update public.get_available_slots to authoritatively honor positive date overrides
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

  -- Level 1: Full-day exception (leave/holiday) blocks the entire date
  if exists (
    select 1 from public.availability_exceptions
    where practitioner_id = p_practitioner_id and date = p_date
      and is_unavailable = true and start_time is null
  ) then
    return;
  end if;

  -- Level 2: Positive Custom Date Overrides (is_unavailable = false)
  -- If positive custom working intervals exist for this specific date,
  -- they completely replace the recurring weekly template for this date.
  if exists (
    select 1 from public.availability_exceptions
    where practitioner_id = p_practitioner_id and date = p_date
      and is_unavailable = false and start_time is not null and end_time is not null
  ) then
    for v_rule in
      select start_time, end_time from public.availability_exceptions
      where practitioner_id = p_practitioner_id and date = p_date
        and is_unavailable = false and start_time is not null and end_time is not null
      order by start_time
    loop
      v_grid_start := (p_date::text || ' ' || v_rule.start_time::text)::timestamp at time zone v_tz;
      v_grid_end := (p_date::text || ' ' || v_rule.end_time::text)::timestamp at time zone v_tz;
      v_cursor := v_grid_start;

      while v_cursor + (v_duration || ' minutes')::interval <= v_grid_end loop
        if not exists (
          -- Level 4: Partial-day unavailable exception overlap
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
          -- Level 5: Existing active booking overlap
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
  else
    -- Level 3: Recurring Weekly Rules fallback
    for v_rule in
      select start_time, end_time from public.availability_rules
      where practitioner_id = p_practitioner_id
        and day_of_week = v_dow
        and effective_from <= p_date
        and (effective_to is null or effective_to >= p_date)
      order by start_time
    loop
      v_grid_start := (p_date::text || ' ' || v_rule.start_time::text)::timestamp at time zone v_tz;
      v_grid_end := (p_date::text || ' ' || v_rule.end_time::text)::timestamp at time zone v_tz;
      v_cursor := v_grid_start;

      while v_cursor + (v_duration || ' minutes')::interval <= v_grid_end loop
        if not exists (
          -- Level 4: Partial-day unavailable exception overlap
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
          -- Level 5: Existing active booking overlap
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
  end if;
end;
$$;

revoke execute on function public.get_available_slots(uuid, uuid, date) from public;
grant execute on function public.get_available_slots(uuid, uuid, date) to anon, authenticated;

-- 2. Atomic Date Availability Override Save RPC
create or replace function public.save_date_availability_override(
  p_practitioner_id uuid,
  p_date date,
  p_is_unavailable boolean,
  p_reason text default null,
  p_intervals jsonb default '[]'::jsonb
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_practitioner_org_id uuid;
  v_interval record;
begin
  -- 1. Authentication & Role Check
  v_role := private.current_role();
  if v_role is null then
    raise exception 'Unauthenticated request';
  end if;

  -- 2. Explicit Role Authorization
  if v_role = 'dentist' then
    if p_practitioner_id <> private.current_practitioner_id() then
      raise exception 'Dentists may only manage their own availability schedule';
    end if;
  elsif v_role = 'owner_admin' then
    if not private.practitioner_in_org(p_practitioner_id) then
      raise exception 'Practitioner does not belong to your clinic organization';
    end if;
  elsif v_role = 'receptionist' then
    raise exception 'Receptionists are not authorized to modify doctor availability schedules';
  else
    raise exception 'Unauthorized schedule access';
  end if;

  -- 3. Multi-tenant Verification & Row Lock
  select b.organization_id
    into v_practitioner_org_id
  from public.practitioners p
  join public.branches b on b.id = p.branch_id
  where p.id = p_practitioner_id
  for update of p;

  if v_practitioner_org_id is null or v_practitioner_org_id <> private.current_org_id() then
    raise exception 'Practitioner does not exist or does not belong to the current organization';
  end if;

  if p_date is null then
    raise exception 'Date must not be null';
  end if;

  -- 4. Execute atomic replacement for the specified date
  if p_is_unavailable = true then
    -- Full-day leave / unavailable mode
    delete from public.availability_exceptions
    where practitioner_id = p_practitioner_id and date = p_date;

    insert into public.availability_exceptions (
      practitioner_id,
      date,
      start_time,
      end_time,
      is_unavailable,
      reason
    ) values (
      p_practitioner_id,
      p_date,
      null,
      null,
      true,
      p_reason
    );
  else
    -- Custom positive working intervals mode
    if p_intervals is null or jsonb_typeof(p_intervals) <> 'array' or jsonb_array_length(p_intervals) = 0 then
      raise exception 'Custom working schedule requires at least one time interval';
    end if;

    -- Validate each interval
    for v_interval in
      select
        (elem->>'startTime')::time as st,
        (elem->>'endTime')::time as et
      from jsonb_array_elements(p_intervals) as elem
    loop
      if v_interval.st is null or v_interval.et is null or v_interval.st >= v_interval.et then
        raise exception 'Invalid interval: start_time (%) must be strictly before end_time (%)', v_interval.st, v_interval.et;
      end if;
    end loop;

    -- Check for overlapping intervals
    if exists (
      with parsed as (
        select
          row_number() over () as rn,
          (elem->>'startTime')::time as st,
          (elem->>'endTime')::time as et
        from jsonb_array_elements(p_intervals) as elem
      )
      select 1
      from parsed p1
      join parsed p2
        on p1.rn <> p2.rn
       and p1.st < p2.et
       and p1.et > p2.st
    ) then
      raise exception 'Custom schedule contains overlapping time intervals';
    end if;

    -- Delete all existing exceptions for date and insert new positive custom intervals
    delete from public.availability_exceptions
    where practitioner_id = p_practitioner_id and date = p_date;

    insert into public.availability_exceptions (
      practitioner_id,
      date,
      start_time,
      end_time,
      is_unavailable,
      reason
    )
    select
      p_practitioner_id,
      p_date,
      (elem->>'startTime')::time,
      (elem->>'endTime')::time,
      false,
      p_reason
    from jsonb_array_elements(p_intervals) as elem;
  end if;
end;
$$;

revoke execute on function public.save_date_availability_override(uuid, date, boolean, text, jsonb) from public;
revoke execute on function public.save_date_availability_override(uuid, date, boolean, text, jsonb) from anon;
grant execute on function public.save_date_availability_override(uuid, date, boolean, text, jsonb) to authenticated;

-- 3. Reset Date Availability Override RPC
create or replace function public.reset_date_availability_override(
  p_practitioner_id uuid,
  p_date date
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_practitioner_org_id uuid;
begin
  -- 1. Authentication & Role Check
  v_role := private.current_role();
  if v_role is null then
    raise exception 'Unauthenticated request';
  end if;

  -- 2. Role Authorization
  if v_role = 'dentist' then
    if p_practitioner_id <> private.current_practitioner_id() then
      raise exception 'Dentists may only manage their own availability schedule';
    end if;
  elsif v_role = 'owner_admin' then
    if not private.practitioner_in_org(p_practitioner_id) then
      raise exception 'Practitioner does not belong to your clinic organization';
    end if;
  elsif v_role = 'receptionist' then
    raise exception 'Receptionists are not authorized to modify doctor availability schedules';
  else
    raise exception 'Unauthorized schedule access';
  end if;

  -- 3. Multi-tenant Verification & Row Lock
  select b.organization_id
    into v_practitioner_org_id
  from public.practitioners p
  join public.branches b on b.id = p.branch_id
  where p.id = p_practitioner_id
  for update of p;

  if v_practitioner_org_id is null or v_practitioner_org_id <> private.current_org_id() then
    raise exception 'Practitioner does not exist or does not belong to the current organization';
  end if;

  if p_date is null then
    raise exception 'Date must not be null';
  end if;

  -- 4. Delete all exceptions for this date, restoring weekly recurring default
  delete from public.availability_exceptions
  where practitioner_id = p_practitioner_id and date = p_date;
end;
$$;

revoke execute on function public.reset_date_availability_override(uuid, date) from public;
revoke execute on function public.reset_date_availability_override(uuid, date) from anon;
grant execute on function public.reset_date_availability_override(uuid, date) to authenticated;
