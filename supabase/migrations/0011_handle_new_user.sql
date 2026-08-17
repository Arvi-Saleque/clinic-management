-- Auto-create a `profiles` row (role='patient') whenever someone signs up
-- through Supabase Auth (patient self-registration on /sign-up). Staff
-- accounts are created by an owner_admin through /settings/users instead,
-- not through this public trigger.
--
-- MVP assumption: single clinic per deployment, so new patients are
-- attached to the one seeded organization. Revisit once multi-org
-- (Medium/Advanced tier) signup exists.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_org_id uuid;
begin
  select id into v_org_id from public.organizations order by created_at limit 1;

  insert into public.profiles (id, organization_id, full_name, email, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    'patient'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
