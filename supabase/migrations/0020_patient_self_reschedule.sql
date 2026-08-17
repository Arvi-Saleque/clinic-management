-- Patient self-service rescheduling. The function derives patient identity
-- from the authenticated session, revalidates availability server-side, and
-- only changes the visit time for a pending/confirmed appointment.

create or replace function public.reschedule_appointment(
  p_appointment_id uuid,
  p_new_starts_at timestamptz
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_patient_id uuid;
  v_practitioner_id uuid;
  v_service_id uuid;
  v_status text;
  v_duration int;
begin
  select patient_id, practitioner_id, service_id, status
    into v_patient_id, v_practitioner_id, v_service_id, v_status
  from public.appointments
  where id = p_appointment_id;

  if v_patient_id is null then
    raise exception 'Appointment not found';
  end if;

  if v_patient_id is distinct from private.current_patient_id() then
    raise exception 'You are not permitted to reschedule this appointment';
  end if;

  if v_status not in ('pending', 'confirmed') then
    raise exception 'This appointment can no longer be rescheduled';
  end if;

  select coalesce(ps.override_duration_minutes, s.duration_minutes)
    into v_duration
  from public.services s
  left join public.practitioner_services ps
    on ps.service_id = s.id and ps.practitioner_id = v_practitioner_id
  where s.id = v_service_id;

  if v_duration is null then
    raise exception 'Appointment service is unavailable';
  end if;

  if not exists (
    select 1
    from public.get_available_slots(v_practitioner_id, v_service_id, p_new_starts_at::date)
    where slot_start = p_new_starts_at
  ) then
    raise exception 'That time is no longer available — please pick another slot';
  end if;

  delete from public.notifications_log
  where appointment_id = p_appointment_id
    and type = 'reminder'
    and status = 'queued';

  update public.appointments
  set starts_at = p_new_starts_at,
      ends_at = p_new_starts_at + (v_duration || ' minutes')::interval,
      status = 'confirmed'
  where id = p_appointment_id;

  insert into public.notifications_log (
    organization_id, patient_id, appointment_id, channel, type, status
  )
  select organization_id, patient_id, id, 'email', 'reschedule_notice', 'queued'
  from public.appointments
  where id = p_appointment_id;
end;
$$;

revoke execute on function public.reschedule_appointment(uuid, timestamptz) from public;
grant execute on function public.reschedule_appointment(uuid, timestamptz) to authenticated;
