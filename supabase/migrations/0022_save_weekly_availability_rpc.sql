-- ---------------------------------------------------------------------
-- 0022_save_weekly_availability_rpc.sql
-- Phase 3B.1: Atomic Multi-Interval Weekly Availability Save RPC
-- ---------------------------------------------------------------------

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

-- Revoke default public execution & grant to authenticated role
revoke all on function public.save_weekly_availability(uuid, uuid, jsonb) from public;
grant execute on function public.save_weekly_availability(uuid, uuid, jsonb) to authenticated;
