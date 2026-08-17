-- Found while wiring patient-facing booking: `appointments_self_update`
-- gave a patient blanket UPDATE on their own appointment row — including
-- columns they should never touch directly (starts_at, status='completed',
-- practitioner_id, ...). Replace it with a narrow RPC, same pattern as
-- book_appointment: patients can only ever transition their own
-- pending/confirmed appointment to 'cancelled', nothing else.

drop policy if exists appointments_self_update on appointments;

create or replace function public.cancel_appointment(
  p_appointment_id uuid,
  p_reason text default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_patient_id uuid;
  v_status text;
begin
  select patient_id, status into v_patient_id, v_status
  from public.appointments where id = p_appointment_id;

  if v_patient_id is null then
    raise exception 'Appointment not found';
  end if;

  if v_patient_id is distinct from private.current_patient_id() and not private.is_staff() then
    raise exception 'You are not permitted to cancel this appointment';
  end if;

  if v_status not in ('pending', 'confirmed') then
    raise exception 'This appointment can no longer be cancelled';
  end if;

  update public.appointments
  set status = 'cancelled', cancellation_reason = coalesce(p_reason, cancellation_reason)
  where id = p_appointment_id;
end;
$$;

revoke execute on function public.cancel_appointment(uuid, text) from public;
grant execute on function public.cancel_appointment(uuid, text) to authenticated;
