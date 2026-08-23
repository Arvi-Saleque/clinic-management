-- Migration 0041: make the existing demo organisation consistently UK-localised.
-- The profile updates are deliberately restricted to the known demo accounts.

alter table public.branches
  alter column timezone set default 'Europe/London';

alter table public.booking_deposits
  alter column currency set default 'GBP';

update public.branches
set timezone = 'Europe/London'
where timezone = 'Asia/Dhaka';

update public.booking_deposits
set currency = 'GBP'
where currency in ('BDT', 'EUR');

update public.branches
set
  name = 'Clinic Care — Manchester',
  address = '42 King Street, Manchester, M2 6BA',
  phone = '+44 1632 960123'
where id = '22222222-2222-2222-2222-222222222222';

update public.opening_hours
set open_time = case
      when day_of_week between 1 and 5 then '08:30'::time
      when day_of_week = 6 then '09:00'::time
      else '00:00'::time
    end,
    close_time = case
      when day_of_week between 1 and 5 then '17:30'::time
      when day_of_week = 6 then '13:00'::time
      else '00:00'::time
    end,
    is_closed = day_of_week = 0
where branch_id = '22222222-2222-2222-2222-222222222222';

update public.profiles
set full_name = case lower(email)
    when 'nadia.islam.demo@cliniccare.test' then 'Dr Charlotte Hughes'
    when 'rafi.ahmed.demo@cliniccare.test' then 'Dr Oliver Bennett'
    when 'emily.white.demo@cliniccare.test' then 'Dr Emily White'
    when 'tariq.hasan.demo@cliniccare.test' then 'Dr George Carter'
    when 'sarah.jenkins.demo@cliniccare.test' then 'Dr Sarah Jenkins'
    when 'marcus.vance.demo@cliniccare.test' then 'Dr Marcus Vance'
    when 'maya.lin.demo@cliniccare.test' then 'Dr Alice Morgan'
    when 'farhan.chowdhury.demo@cliniccare.test' then 'Dr Henry Collins'
    when 'admin.demo@cliniccare.test' then 'Dr William Foster'
    when 'reception.demo@cliniccare.test' then 'Eleanor Brooks'
    when 'zubair.patient.demo@cliniccare.test' then 'Daniel Harper'
    when 'fatima.patient.demo@cliniccare.test' then 'Lucy Walker'
    when 'aarav.patient.demo@cliniccare.test' then 'Thomas Reed'
    else full_name
  end,
  updated_at = now()
where lower(email) in (
  'nadia.islam.demo@cliniccare.test',
  'rafi.ahmed.demo@cliniccare.test',
  'emily.white.demo@cliniccare.test',
  'tariq.hasan.demo@cliniccare.test',
  'sarah.jenkins.demo@cliniccare.test',
  'marcus.vance.demo@cliniccare.test',
  'maya.lin.demo@cliniccare.test',
  'farhan.chowdhury.demo@cliniccare.test',
  'admin.demo@cliniccare.test',
  'reception.demo@cliniccare.test',
  'zubair.patient.demo@cliniccare.test',
  'fatima.patient.demo@cliniccare.test',
  'aarav.patient.demo@cliniccare.test'
);

update public.profiles
set avatar_url = case
    when lower(email) in (
      'nadia.islam.demo@cliniccare.test',
      'emily.white.demo@cliniccare.test',
      'sarah.jenkins.demo@cliniccare.test',
      'maya.lin.demo@cliniccare.test'
    ) then '/marketing/practitioners/dr-charlotte-hughes.webp'
    else '/marketing/practitioners/dr-oliver-bennett.webp'
  end,
  updated_at = now()
where role in ('dentist', 'owner_admin')
  and lower(email) in (
    'nadia.islam.demo@cliniccare.test',
    'rafi.ahmed.demo@cliniccare.test',
    'emily.white.demo@cliniccare.test',
    'tariq.hasan.demo@cliniccare.test',
    'sarah.jenkins.demo@cliniccare.test',
    'marcus.vance.demo@cliniccare.test',
    'maya.lin.demo@cliniccare.test',
    'farhan.chowdhury.demo@cliniccare.test',
    'admin.demo@cliniccare.test'
  );

update public.practitioners p
set photo_url = case
    when lower(pr.email) in (
      'nadia.islam.demo@cliniccare.test',
      'emily.white.demo@cliniccare.test',
      'sarah.jenkins.demo@cliniccare.test',
      'maya.lin.demo@cliniccare.test'
    ) then '/marketing/practitioners/dr-charlotte-hughes.webp'
    else '/marketing/practitioners/dr-oliver-bennett.webp'
  end
from public.profiles pr
where pr.id = p.profile_id
  and lower(pr.email) in (
    'nadia.islam.demo@cliniccare.test',
    'rafi.ahmed.demo@cliniccare.test',
    'emily.white.demo@cliniccare.test',
    'tariq.hasan.demo@cliniccare.test',
    'sarah.jenkins.demo@cliniccare.test',
    'marcus.vance.demo@cliniccare.test',
    'maya.lin.demo@cliniccare.test',
    'farhan.chowdhury.demo@cliniccare.test'
  );

update public.services
set price = case slug
    when 'general-checkup' then 65
    when 'teeth-cleaning' then 95
    when 'cosmetic-veneers' then 950
    when 'root-canal' then 650
    when 'orthodontics' then 85
    when 'pediatric-dentistry' then 55
    else price
  end
where organization_id = '11111111-1111-1111-1111-111111111111';

update public.appointments
set notes = replace(notes, 'Fee: €', 'Fee: £')
where notes like '%Fee: €%';
