-- Migration 0040: Allow patients to update and insert their own medical history records from the patient portal

create policy medical_history_self_update on medical_history
  for update to authenticated
  using (patient_id = private.current_patient_id())
  with check (patient_id = private.current_patient_id());
