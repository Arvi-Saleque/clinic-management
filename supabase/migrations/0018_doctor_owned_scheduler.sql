-- Enforce the diary privacy rule at the database boundary:
-- dentists can only read and change their own availability and appointments.
-- Owner/admin and reception retain clinic-wide diary access.

drop policy if exists availability_rules_staff on availability_rules;
create policy availability_rules_admin_reception on availability_rules
  for all to authenticated
  using (
    private.practitioner_in_org(practitioner_id)
    and private.current_role() in ('owner_admin', 'receptionist')
  )
  with check (
    private.practitioner_in_org(practitioner_id)
    and private.current_role() in ('owner_admin', 'receptionist')
  );
create policy availability_rules_dentist_own on availability_rules
  for all to authenticated
  using (
    private.current_role() = 'dentist'
    and practitioner_id in (select id from practitioners where profile_id = (select auth.uid()))
  )
  with check (
    private.current_role() = 'dentist'
    and practitioner_id in (select id from practitioners where profile_id = (select auth.uid()))
  );

drop policy if exists availability_exceptions_staff on availability_exceptions;
create policy availability_exceptions_admin_reception on availability_exceptions
  for all to authenticated
  using (
    private.practitioner_in_org(practitioner_id)
    and private.current_role() in ('owner_admin', 'receptionist')
  )
  with check (
    private.practitioner_in_org(practitioner_id)
    and private.current_role() in ('owner_admin', 'receptionist')
  );
create policy availability_exceptions_dentist_own on availability_exceptions
  for all to authenticated
  using (
    private.current_role() = 'dentist'
    and practitioner_id in (select id from practitioners where profile_id = (select auth.uid()))
  )
  with check (
    private.current_role() = 'dentist'
    and practitioner_id in (select id from practitioners where profile_id = (select auth.uid()))
  );

drop policy if exists appointments_staff on appointments;
create policy appointments_admin_reception on appointments
  for all to authenticated
  using (
    organization_id = private.current_org_id()
    and private.current_role() in ('owner_admin', 'receptionist')
  )
  with check (
    organization_id = private.current_org_id()
    and private.current_role() in ('owner_admin', 'receptionist')
  );
create policy appointments_dentist_own on appointments
  for all to authenticated
  using (
    organization_id = private.current_org_id()
    and private.current_role() = 'dentist'
    and practitioner_id in (select id from practitioners where profile_id = (select auth.uid()))
  )
  with check (
    organization_id = private.current_org_id()
    and private.current_role() = 'dentist'
    and practitioner_id in (select id from practitioners where profile_id = (select auth.uid()))
  );
