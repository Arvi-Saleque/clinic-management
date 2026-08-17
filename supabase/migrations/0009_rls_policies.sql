-- Row Level Security: patient privacy is the core requirement here.
-- A patient may only ever see their own data; nobody may see another
-- patient's booked-slot identity. This is the MVP security baseline —
-- treat it as a starting point for a real security/pen-test review
-- before production, not a final audit.

-- ---------------------------------------------------------------------
-- Helper functions live in a `private` schema — NOT exposed via the
-- Data API (only `public` is exposed by default), so these can never be
-- called directly by a client, only referenced from inside policies.
-- Every SECURITY DEFINER function re-derives identity from auth.uid()
-- internally, never trusts a caller-supplied id.
-- ---------------------------------------------------------------------

create schema if not exists private;

create or replace function private.current_org_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select organization_id from public.profiles where id = (select auth.uid())
$$;

create or replace function private.current_role() returns text
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create or replace function private.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.current_role() in ('owner_admin', 'receptionist', 'dentist')
$$;

create or replace function private.is_clinician() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.current_role() in ('owner_admin', 'dentist')
$$;

create or replace function private.current_patient_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.patients where profile_id = (select auth.uid())
$$;

create or replace function private.branch_in_org(p_branch_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.branches where id = p_branch_id and organization_id = private.current_org_id()
  )
$$;

create or replace function private.practitioner_in_org(p_practitioner_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.practitioners p
    join public.branches b on b.id = p.branch_id
    where p.id = p_practitioner_id and b.organization_id = private.current_org_id()
  )
$$;

-- Only `authenticated` may invoke these (via policies); anon never needs
-- to, and no role should ever call them directly from client code.
revoke execute on all functions in schema private from public;
grant usage on schema private to authenticated;
grant execute on all functions in schema private to authenticated;

-- ---------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------

alter table organizations enable row level security;
alter table branches enable row level security;
alter table opening_hours enable row level security;
alter table profiles enable row level security;
alter table practitioners enable row level security;
alter table services enable row level security;
alter table practitioner_services enable row level security;
alter table availability_rules enable row level security;
alter table availability_exceptions enable row level security;
alter table patients enable row level security;
alter table family_links enable row level security;
alter table medical_history enable row level security;
alter table registration_submissions enable row level security;
alter table appointments enable row level security;
alter table booking_deposits enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table payments enable row level security;
alter table prescriptions enable row level security;
alter table prescription_items enable row level security;
alter table odontogram_entries enable row level security;
alter table notifications_log enable row level security;
alter table audit_log enable row level security;

-- ---------------------------------------------------------------------
-- organizations / branches / opening_hours / profiles
-- ---------------------------------------------------------------------

create policy org_select_own on organizations
  for select to authenticated
  using (id = private.current_org_id());
create policy org_update_owner on organizations
  for update to authenticated
  using (id = private.current_org_id() and private.current_role() = 'owner_admin')
  with check (id = private.current_org_id() and private.current_role() = 'owner_admin');

create policy branches_public_read on branches
  for select to anon, authenticated
  using (true); -- clinic address/hours are public marketing content
create policy branches_staff_write on branches
  for all to authenticated
  using (organization_id = private.current_org_id() and private.current_role() = 'owner_admin')
  with check (organization_id = private.current_org_id() and private.current_role() = 'owner_admin');

create policy opening_hours_public_read on opening_hours
  for select to anon, authenticated
  using (true);
create policy opening_hours_staff_write on opening_hours
  for all to authenticated
  using (private.branch_in_org(branch_id) and private.current_role() = 'owner_admin')
  with check (private.branch_in_org(branch_id) and private.current_role() = 'owner_admin');

create policy profiles_self_read on profiles
  for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_staff_read on profiles
  for select to authenticated
  using (organization_id = private.current_org_id() and private.is_staff());
create policy profiles_self_update on profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy profiles_owner_manage on profiles
  for all to authenticated
  using (organization_id = private.current_org_id() and private.current_role() = 'owner_admin')
  with check (organization_id = private.current_org_id() and private.current_role() = 'owner_admin');

-- ---------------------------------------------------------------------
-- practitioners / services (public catalogue + staff management)
-- ---------------------------------------------------------------------

create policy practitioners_public_read on practitioners
  for select to anon, authenticated
  using (is_bookable = true);
create policy practitioners_staff_read on practitioners
  for select to authenticated
  using (private.branch_in_org(branch_id));
create policy practitioners_owner_write on practitioners
  for all to authenticated
  using (private.branch_in_org(branch_id) and private.current_role() = 'owner_admin')
  with check (private.branch_in_org(branch_id) and private.current_role() = 'owner_admin');

create policy services_public_read on services
  for select to anon, authenticated
  using (show_on_website = true and is_active = true);
create policy services_staff_read on services
  for select to authenticated
  using (organization_id = private.current_org_id());
create policy services_owner_write on services
  for all to authenticated
  using (organization_id = private.current_org_id() and private.current_role() = 'owner_admin')
  with check (organization_id = private.current_org_id() and private.current_role() = 'owner_admin');

create policy practitioner_services_public_read on practitioner_services
  for select to anon, authenticated
  using (true);
create policy practitioner_services_owner_write on practitioner_services
  for all to authenticated
  using (private.practitioner_in_org(practitioner_id) and private.current_role() = 'owner_admin')
  with check (private.practitioner_in_org(practitioner_id) and private.current_role() = 'owner_admin');

-- ---------------------------------------------------------------------
-- availability_rules / availability_exceptions
-- Staff-only. Patients/anon NEVER read these directly — they only ever
-- see free/busy output from get_available_slots() below, which never
-- exposes whose appointment occupies a slot.
-- ---------------------------------------------------------------------

create policy availability_rules_staff on availability_rules
  for all to authenticated
  using (private.practitioner_in_org(practitioner_id) and private.is_staff())
  with check (private.practitioner_in_org(practitioner_id) and private.is_staff());

create policy availability_exceptions_staff on availability_exceptions
  for all to authenticated
  using (private.practitioner_in_org(practitioner_id) and private.is_staff())
  with check (private.practitioner_in_org(practitioner_id) and private.is_staff());

-- ---------------------------------------------------------------------
-- patients / family_links / medical_history / registration_submissions
-- ---------------------------------------------------------------------

create policy patients_self on patients
  for select to authenticated
  using (profile_id = (select auth.uid()));
create policy patients_self_update on patients
  for update to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
create policy patients_staff on patients
  for all to authenticated
  using (organization_id = private.current_org_id() and private.is_staff())
  with check (organization_id = private.current_org_id() and private.is_staff());

create policy family_links_self on family_links
  for select to authenticated
  using (patient_id = private.current_patient_id());
create policy family_links_staff on family_links
  for all to authenticated
  using (patient_id in (select id from patients where organization_id = private.current_org_id()) and private.is_staff())
  with check (patient_id in (select id from patients where organization_id = private.current_org_id()) and private.is_staff());

create policy medical_history_self_read on medical_history
  for select to authenticated
  using (patient_id = private.current_patient_id());
create policy medical_history_staff_read on medical_history
  for select to authenticated
  using (patient_id in (select id from patients where organization_id = private.current_org_id()) and private.is_staff());
create policy medical_history_clinician_write on medical_history
  for insert to authenticated
  with check (
    patient_id in (select id from patients where organization_id = private.current_org_id())
    and private.is_clinician()
  );

create policy registration_self on registration_submissions
  for all to authenticated
  using (patient_id = private.current_patient_id())
  with check (patient_id = private.current_patient_id());
create policy registration_staff_read on registration_submissions
  for select to authenticated
  using (patient_id in (select id from patients where organization_id = private.current_org_id()) and private.is_staff());
create policy registration_staff_review on registration_submissions
  for update to authenticated
  using (patient_id in (select id from patients where organization_id = private.current_org_id()) and private.is_staff())
  with check (patient_id in (select id from patients where organization_id = private.current_org_id()) and private.is_staff());

-- ---------------------------------------------------------------------
-- appointments — the critical privacy table. No policy here ever allows
-- a patient (or anon) to select another patient's row, and no policy
-- exposes the raw table to anon at all. Slot lookup happens exclusively
-- through get_available_slots(); writes go through book_appointment().
-- ---------------------------------------------------------------------

create policy appointments_self on appointments
  for select to authenticated
  using (patient_id = private.current_patient_id());
create policy appointments_self_update on appointments
  for update to authenticated
  using (patient_id = private.current_patient_id())
  with check (patient_id = private.current_patient_id());
create policy appointments_staff on appointments
  for all to authenticated
  using (organization_id = private.current_org_id() and private.is_staff())
  with check (organization_id = private.current_org_id() and private.is_staff());

create policy booking_deposits_self on booking_deposits
  for select to authenticated
  using (
    appointment_id in (select id from appointments where patient_id = private.current_patient_id())
  );
create policy booking_deposits_staff on booking_deposits
  for all to authenticated
  using (
    appointment_id in (select id from appointments where organization_id = private.current_org_id()) and private.is_staff()
  )
  with check (
    appointment_id in (select id from appointments where organization_id = private.current_org_id()) and private.is_staff()
  );

-- ---------------------------------------------------------------------
-- invoices / invoice_items / payments
-- ---------------------------------------------------------------------

create policy invoices_self_read on invoices
  for select to authenticated
  using (patient_id = private.current_patient_id());
create policy invoices_staff on invoices
  for all to authenticated
  using (organization_id = private.current_org_id() and private.is_staff())
  with check (organization_id = private.current_org_id() and private.is_staff());

create policy invoice_items_self_read on invoice_items
  for select to authenticated
  using (invoice_id in (select id from invoices where patient_id = private.current_patient_id()));
create policy invoice_items_staff on invoice_items
  for all to authenticated
  using (invoice_id in (select id from invoices where organization_id = private.current_org_id()) and private.is_staff())
  with check (invoice_id in (select id from invoices where organization_id = private.current_org_id()) and private.is_staff());

create policy payments_self_read on payments
  for select to authenticated
  using (invoice_id in (select id from invoices where patient_id = private.current_patient_id()));
create policy payments_staff on payments
  for all to authenticated
  using (
    invoice_id in (select id from invoices where organization_id = private.current_org_id())
    and private.current_role() in ('owner_admin', 'receptionist')
  )
  with check (
    invoice_id in (select id from invoices where organization_id = private.current_org_id())
    and private.current_role() in ('owner_admin', 'receptionist')
  );

-- ---------------------------------------------------------------------
-- prescriptions / prescription_items / odontogram_entries
-- Clinical write access is dentist/owner_admin only.
-- ---------------------------------------------------------------------

create policy prescriptions_self_read on prescriptions
  for select to authenticated
  using (patient_id = private.current_patient_id());
create policy prescriptions_staff_read on prescriptions
  for select to authenticated
  using (patient_id in (select id from patients where organization_id = private.current_org_id()) and private.is_staff());
create policy prescriptions_clinician_write on prescriptions
  for insert to authenticated
  with check (
    patient_id in (select id from patients where organization_id = private.current_org_id()) and private.is_clinician()
  );
create policy prescriptions_clinician_update on prescriptions
  for update to authenticated
  using (
    patient_id in (select id from patients where organization_id = private.current_org_id()) and private.is_clinician()
  )
  with check (
    patient_id in (select id from patients where organization_id = private.current_org_id()) and private.is_clinician()
  );

create policy prescription_items_self_read on prescription_items
  for select to authenticated
  using (
    prescription_id in (select id from prescriptions where patient_id = private.current_patient_id())
  );
create policy prescription_items_staff_read on prescription_items
  for select to authenticated
  using (
    prescription_id in (
      select id from prescriptions where patient_id in (select id from patients where organization_id = private.current_org_id())
    ) and private.is_staff()
  );
create policy prescription_items_clinician_write on prescription_items
  for insert to authenticated
  with check (
    prescription_id in (
      select id from prescriptions where patient_id in (select id from patients where organization_id = private.current_org_id())
    ) and private.is_clinician()
  );

create policy odontogram_self_read on odontogram_entries
  for select to authenticated
  using (patient_id = private.current_patient_id());
create policy odontogram_staff_read on odontogram_entries
  for select to authenticated
  using (patient_id in (select id from patients where organization_id = private.current_org_id()) and private.is_staff());
create policy odontogram_clinician_write on odontogram_entries
  for insert to authenticated
  with check (
    patient_id in (select id from patients where organization_id = private.current_org_id()) and private.is_clinician()
  );
create policy odontogram_clinician_update on odontogram_entries
  for update to authenticated
  using (
    patient_id in (select id from patients where organization_id = private.current_org_id()) and private.is_clinician()
  )
  with check (
    patient_id in (select id from patients where organization_id = private.current_org_id()) and private.is_clinician()
  );

-- ---------------------------------------------------------------------
-- notifications_log / audit_log
-- ---------------------------------------------------------------------

create policy notifications_self_read on notifications_log
  for select to authenticated
  using (patient_id = private.current_patient_id());
create policy notifications_staff on notifications_log
  for all to authenticated
  using (organization_id = private.current_org_id() and private.is_staff())
  with check (organization_id = private.current_org_id() and private.is_staff());

create policy audit_log_owner_read on audit_log
  for select to authenticated
  using (organization_id = private.current_org_id() and private.current_role() = 'owner_admin');
-- No insert/update/delete policy for any client role: audit_log is only
-- ever written by the SECURITY DEFINER trigger function below, which
-- runs as the table owner and therefore bypasses RLS entirely.

-- ---------------------------------------------------------------------
-- Generic audit trigger — attached to every sensitive table. Lives in
-- `private` too (trigger functions don't need public EXECUTE at all —
-- Postgres invokes trigger functions regardless of the acting role's
-- direct grants).
-- ---------------------------------------------------------------------

create or replace function private.audit_log() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_new jsonb := case when TG_OP = 'DELETE' then null else to_jsonb(NEW) end;
  v_old jsonb := case when TG_OP = 'INSERT' then null else to_jsonb(OLD) end;
  v_org_id uuid;
  v_patient_id uuid;
begin
  v_org_id := coalesce((v_new ->> 'organization_id')::uuid, (v_old ->> 'organization_id')::uuid);

  if v_org_id is null then
    v_patient_id := coalesce((v_new ->> 'patient_id')::uuid, (v_old ->> 'patient_id')::uuid);
    if v_patient_id is not null then
      select organization_id into v_org_id from public.patients where id = v_patient_id;
    end if;
  end if;

  insert into public.audit_log (organization_id, actor_profile_id, action, entity_type, entity_id, before, after)
  values (
    v_org_id,
    (select auth.uid()),
    lower(TG_OP),
    TG_TABLE_NAME,
    coalesce((v_new ->> 'id')::uuid, (v_old ->> 'id')::uuid),
    v_old,
    v_new
  );

  return coalesce(NEW, OLD);
end;
$$;

create trigger trg_audit_patients after insert or update or delete on patients
  for each row execute function private.audit_log();
create trigger trg_audit_appointments after insert or update or delete on appointments
  for each row execute function private.audit_log();
create trigger trg_audit_invoices after insert or update or delete on invoices
  for each row execute function private.audit_log();
create trigger trg_audit_payments after insert or update or delete on payments
  for each row execute function private.audit_log();
create trigger trg_audit_prescriptions after insert or update or delete on prescriptions
  for each row execute function private.audit_log();
create trigger trg_audit_odontogram after insert or update or delete on odontogram_entries
  for each row execute function private.audit_log();
create trigger trg_audit_medical_history after insert or update or delete on medical_history
  for each row execute function private.audit_log();

-- ---------------------------------------------------------------------
-- get_available_slots — the ONLY way anon/patients learn what's free.
-- Returns free windows only; never row identity, never who holds a slot.
-- Lives in `public` (it's a genuine RPC endpoint, called via
-- supabase.rpc() from anon and authenticated alike) with an explicit
-- grant, not the default PUBLIC execute grant.
-- MVP slot granularity is a fixed 15-minute grid — tune per clinic later.
-- ---------------------------------------------------------------------

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
  select coalesce(ps.override_duration_minutes, s.duration_minutes)
    into v_duration
  from public.services s
  left join public.practitioner_services ps
    on ps.service_id = s.id and ps.practitioner_id = p_practitioner_id
  where s.id = p_service_id;

  if v_duration is null then
    return;
  end if;

  select b.timezone into v_tz
  from public.practitioners p join public.branches b on b.id = p.branch_id
  where p.id = p_practitioner_id;

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

-- ---------------------------------------------------------------------
-- book_appointment — the ONLY write path into `appointments` from
-- untrusted clients. Re-validates the slot server-side (closing the
-- race-condition window between reading availability and writing) and
-- enforces that a patient can only ever book for themselves.
-- ---------------------------------------------------------------------

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
  v_org_id uuid;
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

  select coalesce(ps.override_duration_minutes, s.duration_minutes), s.organization_id
    into v_duration, v_org_id
  from public.services s
  left join public.practitioner_services ps
    on ps.service_id = s.id and ps.practitioner_id = p_practitioner_id
  where s.id = p_service_id;

  if v_duration is null then
    raise exception 'Unknown service';
  end if;

  v_ends_at := p_starts_at + (v_duration || ' minutes')::interval;

  if not exists (
    select 1 from public.get_available_slots(p_practitioner_id, p_service_id, p_starts_at::date)
    where slot_start = p_starts_at
  ) then
    raise exception 'That time is no longer available — please pick another slot';
  end if;

  insert into public.appointments (
    organization_id, branch_id, patient_id, practitioner_id, service_id,
    starts_at, ends_at, status, booking_source, created_by_profile_id, notes
  ) values (
    v_org_id, p_branch_id, p_patient_id, p_practitioner_id, p_service_id,
    p_starts_at, v_ends_at, 'confirmed', p_booking_source, (select auth.uid()), p_notes
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

revoke execute on function public.book_appointment(uuid, uuid, uuid, uuid, timestamptz, text, text) from public;
grant execute on function public.book_appointment(uuid, uuid, uuid, uuid, timestamptz, text, text) to authenticated;
