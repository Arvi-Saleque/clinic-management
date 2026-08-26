-- Migration 0043: Clean Legacy Dummy and Test Services
-- Permanently deletes test entries such as 'AB', 'dat uthano', 'demo_procedure', 'sd', 'services', 'আআআআ'

-- 1. Remove practitioner_services links for these dummy services
delete from public.practitioner_services
where service_id in (
  select id from public.services
  where slug in (
    'demo-procedure-mt85mnzx',
    'sd-mt00szfs',
    'services-mt0e8713',
    'service-mt2u1ez2',
    'service-mt2tzlt8'
  )
  or lower(name) in ('ab', 'dat uthano', 'demo_procedure', 'sd', 'services', 'আআআআ')
  or name ilike '%dat uthano%'
  or name ilike '%demo_procedure%'
  or name ilike '%আআআআ%'
);

-- 2. Nullify references in appointments or clinical records if test bookings existed
update public.appointments
set service_id = null
where service_id in (
  select id from public.services
  where slug in (
    'demo-procedure-mt85mnzx',
    'sd-mt00szfs',
    'services-mt0e8713',
    'service-mt2u1ez2',
    'service-mt2tzlt8'
  )
  or lower(name) in ('ab', 'dat uthano', 'demo_procedure', 'sd', 'services', 'আআআআ')
  or name ilike '%dat uthano%'
  or name ilike '%demo_procedure%'
  or name ilike '%আআআআ%'
);

-- 3. Delete from public.services
delete from public.services
where slug in (
  'demo-procedure-mt85mnzx',
  'sd-mt00szfs',
  'services-mt0e8713',
  'service-mt2u1ez2',
  'service-mt2tzlt8'
)
or lower(name) in ('ab', 'dat uthano', 'demo_procedure', 'sd', 'services', 'আআআআ')
or name ilike '%dat uthano%'
or name ilike '%demo_procedure%'
or name ilike '%আআআআ%';
