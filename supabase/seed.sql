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
--           'Dr. Nadia Islam', 'nadia@example.com', 'dentist');

insert into organizations (id, name, slug, plan_tier) values
  ('11111111-1111-1111-1111-111111111111', 'Clinic Care Dental', 'clinic-care', 'basic');

insert into branches (id, organization_id, name, address, phone, email, is_primary) values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'Clinic Care — Main Branch', 'House 12, Road 4, Dhaka', '+8801700000000',
   'hello@cliniccare.example', true);

insert into opening_hours (branch_id, day_of_week, open_time, close_time, is_closed) values
  ('22222222-2222-2222-2222-222222222222', 0, '10:00', '18:00', false), -- Sunday
  ('22222222-2222-2222-2222-222222222222', 1, '10:00', '18:00', false), -- Monday
  ('22222222-2222-2222-2222-222222222222', 2, '10:00', '18:00', false),
  ('22222222-2222-2222-2222-222222222222', 3, '10:00', '18:00', false),
  ('22222222-2222-2222-2222-222222222222', 4, '10:00', '18:00', false),
  ('22222222-2222-2222-2222-222222222222', 5, '00:00', '00:00', true),  -- Friday closed
  ('22222222-2222-2222-2222-222222222222', 6, '10:00', '16:00', false);

insert into services
  (organization_id, branch_id, name, slug, description, duration_minutes, price, category)
values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'General Check-up', 'general-checkup', 'Comprehensive oral health assessment.', 30, 800, 'General'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Teeth Cleaning', 'teeth-cleaning', 'Professional scaling and polishing.', 45, 1200, 'Hygiene'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Cosmetic Veneers', 'cosmetic-veneers', 'Custom porcelain veneers.', 60, 8000, 'Cosmetic'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Root Canal Therapy', 'root-canal', 'Pain-managed root canal treatment.', 90, 4500, 'Restorative');
