-- Found while building the public /practitioners pages: profiles has no
-- anon/public SELECT policy at all (by design -- it holds every user's
-- name/email/phone, including patients). But a practitioner's name is
-- meant to be public on a clinic website ("meet the doctor"), so the
-- PostgREST embed `practitioners -> profiles:profile_id(full_name)` was
-- silently returning null for anon requests and falling back to a
-- generic "Practitioner" label in the UI.
--
-- Scoped fix: a profile is publicly readable ONLY when it belongs to a
-- currently bookable practitioner. Patient and non-bookable-staff
-- profiles remain completely invisible to anon/other patients, matching
-- every other policy in this file. Application code still only selects
-- full_name for these public pages (see src/lib/server/marketing.ts) --
-- this policy permits more than that, but least-privilege is enforced in
-- practice by what the queries actually ask for.

create policy profiles_public_practitioner_read on profiles
  for select to anon, authenticated
  using (
    id in (select profile_id from practitioners where is_bookable = true)
  );
