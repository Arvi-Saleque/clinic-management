-- Normalize all existing pending appointments to confirmed
update public.appointments
set status = 'confirmed'
where status = 'pending';

-- Set default column value to confirmed
alter table public.appointments
alter column status set default 'confirmed';
