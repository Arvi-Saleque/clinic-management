-- Module 9: Confirmation & Reminders.
--
-- Scope note: this wires the full DATA layer -- every booking confirmation,
-- cancellation, and pre-appointment reminder is reliably queued into
-- notifications_log regardless of which code path touched the
-- appointment (RPC or direct staff update). Actual email/SMS DISPATCH
-- (calling out to a provider like Resend/Twilio) is not implemented here
-- -- that requires provider credentials this environment doesn't have.
-- Rows stay status='queued' until a dispatch worker (Edge Function,
-- polling notifications_log for 'queued' rows) is wired up later.

create extension if not exists pg_cron with schema extensions;

-- ---------------------------------------------------------------------
-- Confirmation: every appointment insert with status='confirmed'
-- (book_appointment always inserts confirmed, for both online and
-- staff/phone bookings) queues one booking_confirmation row.
-- ---------------------------------------------------------------------

create or replace function private.notify_appointment_confirmation() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if NEW.status = 'confirmed' then
    insert into public.notifications_log (organization_id, patient_id, appointment_id, channel, type, status)
    values (NEW.organization_id, NEW.patient_id, NEW.id, 'email', 'booking_confirmation', 'queued');
  end if;
  return NEW;
end;
$$;

create trigger trg_notify_booking_confirmation
  after insert on appointments
  for each row execute function private.notify_appointment_confirmation();

-- ---------------------------------------------------------------------
-- Cancellation: fires whenever status transitions TO cancelled, whether
-- via cancel_appointment (patient) or a direct staff status update.
-- ---------------------------------------------------------------------

create or replace function private.notify_appointment_cancellation() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if NEW.status = 'cancelled' and OLD.status is distinct from 'cancelled' then
    insert into public.notifications_log (organization_id, patient_id, appointment_id, channel, type, status)
    values (NEW.organization_id, NEW.patient_id, NEW.id, 'email', 'cancellation_notice', 'queued');
  end if;
  return NEW;
end;
$$;

create trigger trg_notify_appointment_cancellation
  after update on appointments
  for each row execute function private.notify_appointment_cancellation();

-- ---------------------------------------------------------------------
-- Reminders: scheduled sweep, not a trigger (reminders fire relative to
-- clock time, not a data change). Queues exactly one reminder per
-- appointment landing in a ~24h window; the 2-hour window with an
-- hourly cron tick guarantees each appointment is caught exactly once
-- without needing separate dedup bookkeeping beyond "does a reminder
-- row already exist for this appointment".
-- ---------------------------------------------------------------------

create or replace function public.queue_appointment_reminders() returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications_log (organization_id, patient_id, appointment_id, channel, type, status)
  select a.organization_id, a.patient_id, a.id, 'email', 'reminder', 'queued'
  from public.appointments a
  where a.status = 'confirmed'
    and a.starts_at between now() + interval '23 hours' and now() + interval '25 hours'
    and not exists (
      select 1 from public.notifications_log n
      where n.appointment_id = a.id and n.type = 'reminder'
    );
end;
$$;

revoke execute on function public.queue_appointment_reminders() from public;

select cron.schedule(
  'queue-appointment-reminders',
  '0 * * * *',
  $$select public.queue_appointment_reminders();$$
);
