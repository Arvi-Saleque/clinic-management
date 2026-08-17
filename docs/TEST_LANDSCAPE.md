# Test landscape

> **2026-08-14 delivery note:** This file is a historical test scan. The current delivery passes TypeScript, ESLint, Next.js production build, Sites artifact validation, and browser smoke QA; it still does not include a full automated clinical integration suite.

**Bottom line: there is no automated test suite in this repository.** `package.json` has no `test` script and no test runner (Jest/Vitest/Playwright) is installed. Everything below reflects manual verification performed during development sessions, not repeatable CI-gated tests.

## Test layers

| Layer | What it covers | Command | Gate |
|---|---|---|---|
| TypeScript compilation | Type correctness across the whole app | `npm run build` (runs `next build`, which type-checks) | Build fails on type errors — the only automated gate that exists |
| ESLint | Lint rules (`eslint-config-next`) | `npm run lint` | None wired to CI; not run as part of `build` |
| Manual live DB verification | RLS policies, triggers, RPCs | ad-hoc `curl` against the live Supabase REST API (see below) | None — one-off, not scripted, not repeatable |
| Manual dev-server smoke test | Page rendering, redirects | `npm run dev` + `curl` | None — one-off |

There is no CI configuration file (no `.github/workflows/`, no other CI config found in the repo).

## Coverage matrix

| Code area | Tests that touch it | File paths | Status |
|---|---|---|---|
| Next.js build/type-check | `npm run build` | whole `src/` tree | Passing as of last verification (2026-08-10) |
| RLS: patient self-insert | Manual curl, real signup | `supabase/migrations/0012_patient_self_registration.sql` | Verified once, live, this session — not repeatable |
| RLS: cross-patient isolation | Manual curl, two real patient sessions | `supabase/migrations/0009_rls_policies.sql` | Verified once, live, this session — not repeatable |
| RLS: anon table access | Manual curl, no auth header | `patients` table | Verified once — anon reads return `[]`, not an error |
| `handle_new_user` trigger | Manual curl (Supabase Admin API signup) | `supabase/migrations/0011_handle_new_user.sql` | Verified once — `profiles` row appeared with correct `role`/`organization_id` |
| `get_available_slots` RPC | Manual curl, real practitioner + `availability_rules` seeded via secret key | `supabase/migrations/0009_rls_policies.sql` | Verified — correct 15-min slots in branch timezone; slot disappears immediately after booking |
| `book_appointment` RPC | Manual curl, both `booking_source` paths | same file | Verified — staff (`phone`) and patient (`online`) booking both succeed; duplicate booking of the same slot correctly rejected (`400`, DB exclusion constraint backstop confirmed working) |
| `cancel_appointment` RPC | Manual curl | `supabase/migrations/0013_cancel_appointment_rpc.sql` | Verified — own cancellable appointment succeeds (`204`); re-cancel rejected; cancelling another patient's appointment rejected |
| RLS: `appointments_self_update` removal (security fix) | Manual curl, direct `PATCH /rest/v1/appointments` as the owning patient | `supabase/migrations/0013_cancel_appointment_rpc.sql` | Verified — a patient attempting `{"status":"completed"}` directly now gets `200 []` (0 rows affected), confirming the old blanket-UPDATE policy is gone |
| Auth guard redirects | Manual curl (`/dashboard`, `/portal/dashboard` while signed out) | `src/lib/auth/guards.ts` | Verified — both redirect to `/login` |
| Marketing homepage rendering | Manual curl + grep for section text | `src/app/(marketing)/page.tsx` and children | Verified after the full-width layout refactor |
| Scheduler UI (`/scheduler`) | Live RPC calls simulating the UI's calls (not the rendered page itself — see note below) | `src/app/(staff)/scheduler/page.tsx` and children | Underlying data flow verified; page HTML never curled with a real staff session (cookie-based SSR auth isn't practical to fake via curl) |
| Booking wizard UI (`/portal/appointments/book`) | Same as above | `src/components/portal/booking-wizard.tsx` | Underlying data flow verified; page HTML not curled |
| Invoicing / prescriptions / odontogram / reminders | none | modules 6, 7, 8, 9 | **Not built**, so not testable |

## Integration tests

None exist as code. The manual flows exercised live this session (not repeatable without re-running curl commands by hand):

1. **Sign-up → trigger → profile check**: POST `/auth/v1/signup` → verified `profiles` row via secret-key REST query.
2. **Patient self-registration RLS**: admin-confirmed a test user's email → password-grant login → `POST /rest/v1/patients` as that user → `201`.
3. **Cross-patient privacy**: created a second `patients` row via secret key (no `profile_id`) → queried `/rest/v1/patients` with patient 1's token → got back only patient 1's row.
4. **Anon isolation**: queried `/rest/v1/patients` with only the publishable key (no user session) → `[]`.
5. **Public RPC**: called `get_available_slots` with no auth → `200 []`.
6. **Route guards**: `curl -L` against `/dashboard` and `/portal/dashboard` while signed out → both landed on `/login`.
7. **Staff scheduling**: created a real dentist (`profiles.role='dentist'`) + `practitioners` row + `availability_rules` (09:00–18:00 every day) via secret key → booked a slot via `book_appointment` (`booking_source:"phone"`) → confirmed the exact same slot is rejected on a second attempt → confirmed the slot vanishes from `get_available_slots` → confirmed the dentist can view and `PATCH` the appointment's status under RLS (`appointments_staff` policy).
8. **Patient online booking**: created a second real patient, self-registered → booked via `book_appointment` (`booking_source:"online"`) → attempted a direct `PATCH` to set `status:"completed"` (correctly blocked, `200 []`) → cancelled via `cancel_appointment` (succeeded) → re-cancel rejected → attempted to cancel the dentist's unrelated appointment (correctly rejected, "You are not permitted to cancel this appointment").

All test data created during these flows was deleted afterward via the secret-key admin API, **except** the demo dentist/practitioner/`availability_rules` from flow 7, which were kept intentionally as working sample data — login `claude.test.dentist.1786301149@mailinator.com` / `TestPass1234!` shows a populated `/scheduler`.

## Known gaps

- **No automated regression protection at all.** Any future schema or RLS change could silently break the privacy guarantees verified manually above.
- **No test coverage for**: booking flow, invoicing, prescriptions, odontogram, notifications/reminders (all unbuilt).
- **No accessibility testing** (no `axe`/Lighthouse CI wired in, despite `prefers-reduced-motion` handling being built into every `src/components/motion/*` primitive).
- **No visual regression testing** for the motion-heavy marketing site.
- **`multiple_permissive_policies` performance warnings** from `supabase db advisors` (self+staff SELECT policy pairs on ~15 tables) are a known, deliberately deferred optimization — not a correctness bug, just untested under real load.

## Gates

None configured. `npm run build` is the only thing that currently blocks anything (locally; there is no CI to enforce it on push).

## Recommended next actions

1. Add a test runner (Vitest is the natural fit for a Next.js App Router + Server Actions project) before building more modules — the RLS/privacy guarantees especially need repeatable tests, not one-off curl sessions.
2. At minimum, script the 6 manual flows above as an integration test that runs against a disposable/branch Supabase project, not production data.
3. Add CI (`.github/workflows/`) running `npm run build` + `npm run lint` on every PR once this repo is pushed to a remote.
