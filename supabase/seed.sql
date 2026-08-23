-- Demo data for local development. Run after all migrations.
--
-- Practitioner/staff/patient rows are intentionally NOT seeded here:
-- profiles.id must reference a real auth.users row, and auth.users rows
-- only exist once someone actually signs up (via the app, the Supabase
-- dashboard, or `supabase.auth.admin.createUser` in a one-off script).
-- Seed those after creating a couple of test accounts locally, e.g.:
--
--   insert into profiles (id, organization_id, full_name, email, role)
--   values ('<auth-user-uuid>', '11111111-1111-1111-1111-111111111111',
--           'Dr Oliver Bennett', 'oliver.bennett@example.com', 'dentist');

insert into organizations (id, name, slug, plan_tier) values
  ('11111111-1111-1111-1111-111111111111', 'Clinic Care Dental', 'clinic-care', 'basic');

insert into branches (id, organization_id, name, address, phone, email, is_primary) values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'Clinic Care — Manchester', '42 King Street, Manchester, M2 6BA', '+44 1632 960123',
   'hello@cliniccare.example', true);

update branches
set timezone = 'Europe/London'
where id = '22222222-2222-2222-2222-222222222222';

insert into opening_hours (branch_id, day_of_week, open_time, close_time, is_closed) values
  ('22222222-2222-2222-2222-222222222222', 0, '00:00', '00:00', true),  -- Sunday closed
  ('22222222-2222-2222-2222-222222222222', 1, '08:30', '17:30', false), -- Monday
  ('22222222-2222-2222-2222-222222222222', 2, '08:30', '17:30', false),
  ('22222222-2222-2222-2222-222222222222', 3, '08:30', '17:30', false),
  ('22222222-2222-2222-2222-222222222222', 4, '08:30', '17:30', false),
  ('22222222-2222-2222-2222-222222222222', 5, '08:30', '17:30', false),
  ('22222222-2222-2222-2222-222222222222', 6, '09:00', '13:00', false);

insert into service_categories (organization_id, name, description) values
  ('11111111-1111-1111-1111-111111111111', 'General Dentistry', 'Routine examinations and preventive care.'),
  ('11111111-1111-1111-1111-111111111111', 'Dental Hygiene', 'Professional hygiene and periodontal maintenance.'),
  ('11111111-1111-1111-1111-111111111111', 'Cosmetic Dentistry', 'Aesthetic treatments planned around the patient.'),
  ('11111111-1111-1111-1111-111111111111', 'Restorative Dentistry', 'Treatments that restore function and comfort.')
on conflict (organization_id, name) do nothing;

insert into services
  (organization_id, branch_id, name, slug, description, duration_minutes, price, category_id)
values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'New Patient Examination', 'new-patient-examination', 'Comprehensive oral health assessment and treatment discussion.', 40, 65,
   (select id from service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'General Dentistry')),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Dental Hygiene Appointment', 'dental-hygiene', 'Professional scale, polish and personalised oral-hygiene advice.', 45, 95,
   (select id from service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Dental Hygiene')),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Porcelain Veneer', 'porcelain-veneer', 'Bespoke porcelain veneer planned and priced per tooth.', 60, 950,
   (select id from service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Cosmetic Dentistry')),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Root Canal Treatment', 'root-canal-treatment', 'Root canal treatment with a clear clinical and fee plan.', 90, 650,
   (select id from service_categories where organization_id = '11111111-1111-1111-1111-111111111111' and name = 'Restorative Dentistry'));
