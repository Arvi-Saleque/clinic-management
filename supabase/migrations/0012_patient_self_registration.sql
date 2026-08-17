-- Gap found while building the digital-registration flow: a patient could
-- SELECT/UPDATE their own `patients` row (patients_self / patients_self_update)
-- but never INSERT it in the first place — only staff could. A patient must
-- be able to create their own patient record and first medical_history
-- entry via the intake form.

create policy patients_self_insert on patients
  for insert to authenticated
  with check (
    profile_id = (select auth.uid())
    and organization_id = private.current_org_id()
  );

create policy medical_history_self_insert on medical_history
  for insert to authenticated
  with check (
    patient_id = private.current_patient_id()
    and source = 'digital_intake'
  );
