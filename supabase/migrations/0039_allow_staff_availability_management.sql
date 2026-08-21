-- ---------------------------------------------------------------------
-- 0039_allow_staff_availability_management.sql
-- Allow receptionists and practice staff to manage doctor availability
-- ---------------------------------------------------------------------

-- 1. Atomic Multi-Interval Weekly Availability Save RPC
create or replace function public.save_weekly_availability(
  p_practitioner_id uuid,
  p_branch_id uuid,
  p_rules jsonb
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_practitioner_branch_id uuid;
  v_practitioner_org_id uuid;
  v_branch_org_id uuid;
  v_rule record;
begin
  -- 1. Authentication & Role Check
  v_role := private.current_role();
  if v_role is null then
    raise exception 'Unauthenticated request';
  end if;

  -- 2. Explicit Role Authorization
  if v_role = 'dentist' then
    -- Dentist can ONLY modify their own practitioner record
    if p_practitioner_id <> private.current_practitioner_id() then
      raise exception 'Dentists may only manage their own availability schedule';
    end if;
  elsif v_role in ('owner_admin', 'receptionist') then
    -- Owner/Admin and Receptionists may manage practitioners within their organization
    if not private.practitioner_in_org(p_practitioner_id) then
      raise exception 'Practitioner does not belong to your clinic organization';
    end if;
  else
    raise exception 'Unauthorized schedule access';
  end if;

  -- 3. Verify Practitioner & Branch multi-tenant integrity and acquire exclusive row lock
  select p.branch_id, b.organization_id
    into v_practitioner_branch_id, v_practitioner_org_id
  from public.practitioners p
  join public.branches b on b.id = p.branch_id
  where p.id = p_practitioner_id
  for update of p;

  if v_practitioner_org_id is null or v_practitioner_org_id <> private.current_org_id() then
    raise exception 'Practitioner does not exist or does not belong to the current organization';
  end if;

  -- Validate target branch belongs to same organization
  select organization_id into v_branch_org_id
  from public.branches
  where id = p_branch_id;

  if v_branch_org_id is null or v_branch_org_id <> private.current_org_id() then
    raise exception 'Branch does not exist or does not belong to the current organization';
  end if;

  -- 4. Validate p_rules JSON Array
  if p_rules is null or jsonb_typeof(p_rules) <> 'array' then
    raise exception 'p_rules must be a non-null JSON array of intervals';
  end if;

  -- Check individual interval validity
  for v_rule in
    select
      (elem->>'day_of_week')::smallint as dow,
      (elem->>'start_time')::time as st,
      (elem->>'end_time')::time as et
    from jsonb_array_elements(p_rules) as elem
  loop
    if v_rule.dow is null or v_rule.dow < 0 or v_rule.dow > 6 then
      raise exception 'Invalid day_of_week: must be between 0 (Sunday) and 6 (Saturday)';
    end if;
    if v_rule.st is null or v_rule.et is null or v_rule.st >= v_rule.et then
      raise exception 'Invalid interval: start_time (%) must be strictly before end_time (%)', v_rule.st, v_rule.et;
    end if;
  end loop;

  -- Check for overlapping or duplicate intervals on the same day_of_week
  if exists (
    with parsed as (
      select
        row_number() over () as rn,
        (elem->>'day_of_week')::smallint as dow,
        (elem->>'start_time')::time as st,
        (elem->>'end_time')::time as et
      from jsonb_array_elements(p_rules) as elem
    )
    select 1
    from parsed p1
    join parsed p2
      on p1.dow = p2.dow
     and p1.rn < p2.rn
    where p1.st < p2.et and p1.et > p2.st
  ) then
    raise exception 'Overlapping or duplicate time intervals detected on the same weekday';
  end if;

  -- 5. Atomic Delete & Reinsert in single transaction
  delete from public.availability_rules
  where practitioner_id = p_practitioner_id;

  if jsonb_array_length(p_rules) > 0 then
    insert into public.availability_rules (
      practitioner_id,
      branch_id,
      day_of_week,
      start_time,
      end_time,
      effective_from
    )
    select
      p_practitioner_id,
      coalesce(v_practitioner_branch_id, p_branch_id),
      (elem->>'day_of_week')::smallint,
      (elem->>'start_time')::time,
      (elem->>'end_time')::time,
      current_date
    from jsonb_array_elements(p_rules) as elem;
  end if;
end;
$$;

revoke all on function public.save_weekly_availability(uuid, uuid, jsonb) from public;
grant execute on function public.save_weekly_availability(uuid, uuid, jsonb) to authenticated;


-- 2. Authoritative Date Availability Override RPC
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
  elsif v_role in ('owner_admin', 'receptionist') then
    if not private.practitioner_in_org(p_practitioner_id) then
      raise exception 'Practitioner does not belong to your clinic organization';
    end if;
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
  elsif v_role in ('owner_admin', 'receptionist') then
    if not private.practitioner_in_org(p_practitioner_id) then
      raise exception 'Practitioner does not belong to your clinic organization';
    end if;
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
