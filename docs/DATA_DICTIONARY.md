# Data Dictionary

> **2026-08-14 delivery note:** Migrations `0018_doctor_owned_scheduler.sql` and `0019_odontogram_treatment_planning.sql` extend the security and clinical fields described in this earlier snapshot.

Every table in `public` (Postgres, Supabase project `mxywvlekwgrzlewxgfcl`). All tables have RLS enabled (verified live: `select relrowsecurity from pg_class` → `true` for all 22 rows). Source of truth: `supabase/migrations/0001` through `0012`.

## Type: `organizations`

**Where:** `supabase/migrations/0002_core_org.sql`

| Field | Type | Required | Meaning | Example |
|---|---|---|---|---|
| id | uuid | yes | PK | `11111111-1111-1111-1111-111111111111` (seeded) |
| name | text | yes | Clinic org name | "Clinic Care Dental" |
| slug | text | yes, unique | URL-safe identifier | "clinic-care" |
| plan_tier | text | yes | `basic` \| `medium` \| `advanced` | "basic" |
| created_at | timestamptz | yes | — | — |

**Consumed by:** `private.current_org_id()`, every staff-scoped RLS policy.
**Produced by:** `supabase/seed.sql` (1 demo row).

## Type: `branches`

**Where:** `0002_core_org.sql`

| Field | Type | Required | Meaning | Example |
|---|---|---|---|---|
| id | uuid | yes | PK | — |
| organization_id | uuid | yes | FK → organizations | — |
| name | text | yes | — | "Clinic Care — Main Branch" |
| address, phone, email | text | no | — | — |
| timezone | text | yes | default `'Asia/Dhaka'` | "Asia/Dhaka" |
| is_primary | boolean | yes | default `true` | — |
| created_at | timestamptz | yes | — | — |

**Consumed by:** `private.branch_in_org()`, `get_available_slots()` (reads `branches.timezone`).
**Produced by:** seed (1 row).

## Type: `opening_hours`

**Where:** `0002_core_org.sql`

| Field | Type | Required | Meaning | Example |
|---|---|---|---|---|
| id | uuid | yes | PK | — |
| branch_id | uuid | yes | FK → branches | — |
| day_of_week | smallint | yes | 0=Sunday..6 | 0 |
| open_time, close_time | time | no | — | "10:00" |
| is_closed | boolean | yes | default `false` | — |

**Produced by:** seed (7 rows, Friday closed).

## Type: `profiles`

**Where:** `0002_core_org.sql`. **The role source-of-truth for every RLS policy in the codebase.**

| Field | Type | Required | Meaning | Example |
|---|---|---|---|---|
| id | uuid | yes | PK, FK → `auth.users(id)` | — |
| organization_id | uuid | no | FK → organizations | — |
| full_name | text | yes | — | "Test Patient One" |
| email | text | yes | — | — |
| phone, avatar_url | text | no | — | — |
| role | text | yes | CHECK: `owner_admin` \| `receptionist` \| `dentist` \| `patient` | "patient" |
| is_active | boolean | yes | default `true` | — |
| created_at, updated_at | timestamptz | yes | — | — |

**Consumed by:** `src/lib/auth/session.ts` (`getProfile`), `src/lib/auth/guards.ts`, every `private.*` RLS helper function.
**Produced by:** `public.handle_new_user()` trigger (see `0011_handle_new_user.sql`) — fires on every `auth.users` insert, auto-assigns `role='patient'` and `organization_id` = the first-created org. **Staff profiles are not self-service** — no UI creates `owner_admin`/`receptionist`/`dentist` rows yet (planned: `/settings/users`, not built).

## Type: `practitioners`

**Where:** `0003_practitioners_services.sql`

| Field | Type | Required | Meaning | Example |
|---|---|---|---|---|
| id | uuid | yes | PK | — |
| profile_id | uuid | yes, unique | FK → profiles | — |
| branch_id | uuid | yes | FK → branches | — |
| title, bio, photo_url | text | no | — | — |
| specialties | text[] | yes | default `{}` | `["Cosmetic Dentistry"]` |
| is_bookable | boolean | yes | default `true` | — |
| created_at | timestamptz | yes | — | — |

**Not yet seeded** — no practitioner rows exist in the live DB (this is why `get_available_slots` currently returns `[]`).

## Type: `services`

**Where:** `0003_practitioners_services.sql`

| Field | Type | Required | Meaning | Example |
|---|---|---|---|---|
| id | uuid | yes | PK | `e1eb99aa-46a0-4ba1-abca-35645b20e01d` (live, "General Check-up") |
| organization_id | uuid | yes | FK | — |
| branch_id | uuid | no | FK, null = org-wide | — |
| name, slug | text | yes | unique per org | "General Check-up" / "general-checkup" |
| description | text | no | — | — |
| duration_minutes | int | yes | > 0 | 30 |
| price | numeric(10,2) | yes | default 0 | 800.00 |
| category | text | no | — | "General" |
| is_active, show_on_website | boolean | yes | both default `true` | — |

**Seeded (live, 4 rows):** General Check-up (800, 30min), Teeth Cleaning (1200, 45min), Cosmetic Veneers (8000, 60min), Root Canal Therapy (4500, 90min) — all `organization_id = 11111111-1111-1111-1111-111111111111`.
**Consumed by:** `get_available_slots()`, `book_appointment()`, marketing site (currently reads `src/lib/mock-data.ts` instead — not yet wired to this table).

## Type: `practitioner_services`

**Where:** `0003_practitioners_services.sql`. Join table with per-practitioner overrides.

| Field | Type | Required | Meaning |
|---|---|---|---|
| practitioner_id | uuid | yes | PK part 1, FK |
| service_id | uuid | yes | PK part 2, FK |
| override_duration_minutes | int | no | overrides `services.duration_minutes` for this practitioner |
| override_price | numeric(10,2) | no | overrides `services.price` |

## Type: `patients`

**Where:** `0004_patients.sql`. **The central patient record.**

| Field | Type | Required | Meaning | Example |
|---|---|---|---|---|
| id | uuid | yes | PK | — |
| organization_id | uuid | yes | FK | — |
| profile_id | uuid | no, unique | FK → profiles; **null for staff-created walk-in patients with no portal login** | — |
| first_name, last_name | text | yes | split from `profiles.full_name` on registration | "Test" / "PatientOne" |
| dob | date | no | — | "1990-01-01" |
| gender | text | no | — | — |
| phone, email, address | text/text | no | — | — |
| emergency_contact_name, emergency_contact_phone | text | no | required by the registration form's zod schema, but nullable in DB | — |
| created_by_staff_id | uuid | no | FK → profiles, set when staff creates the record | — |
| created_at, updated_at | timestamptz | yes | — | — |

**Consumed by:** `private.current_patient_id()` (looks up by `profile_id = auth.uid()`), nearly every other clinical/billing table via `patient_id` FK.
**Produced by:** `registerPatientAction` (patient self-registration) or future staff "add patient" UI (not built).
**Constraint note:** `profile_id unique` means one portal account maps to exactly one patient record.

## Type: `family_links`

**Where:** `0004_patients.sql`. Guardian/dependent relationships.

| Field | Type | Required | Meaning |
|---|---|---|---|
| id | uuid | yes | PK |
| patient_id | uuid | yes | FK → patients (the dependent) |
| guardian_patient_id | uuid | no | FK → patients, if the guardian is also a patient |
| guardian_name, guardian_relationship, guardian_phone, guardian_email | text | no | — |
| is_primary_contact | boolean | yes | default `false` |

**Status:** schema exists, no UI reads/writes it yet.

## Type: `medical_history`

**Where:** `0004_patients.sql`. **Append-only, versioned** — never UPDATEd, only new rows inserted with `is_current` flipped.

| Field | Type | Required | Meaning | Example |
|---|---|---|---|---|
| id | uuid | yes | PK | — |
| patient_id | uuid | yes | FK | — |
| version | int | yes | unique per `(patient_id, version)` | 1 |
| recorded_by_staff_id | uuid | no | FK → profiles, null for patient self-entry | — |
| source | text | yes | CHECK: `digital_intake` \| `staff_update` | "digital_intake" |
| allergies, current_medications, chronic_conditions | text[] | yes | default `{}` | `["Penicillin"]` |
| past_surgeries, notes | text | no | — | — |
| is_current | boolean | yes | default `true` | — |
| created_at | timestamptz | yes | — | — |

**Produced by:** `registerPatientAction` (version 1, `source='digital_intake'`). No UI yet creates version 2+ (staff clinical updates — module not built).

## Type: `registration_submissions`

**Where:** `0004_patients.sql`

| Field | Type | Required | Meaning |
|---|---|---|---|
| id | uuid | yes | PK |
| patient_id | uuid | yes | FK |
| submitted_at | timestamptz | yes | default `now()` |
| form_version | int | yes | default 1 |
| raw_payload | jsonb | yes | the entire parsed registration form input, verbatim |
| status | text | yes | CHECK: `pending_review` \| `reviewed` |
| reviewed_by_staff_id, reviewed_at | uuid / timestamptz | no | set when staff reviews (no UI yet) |

**Produced by:** `registerPatientAction`.

## Type: `availability_rules`

**Where:** `0005_availability_appointments.sql`. Recurring weekly availability.

| Field | Type | Required | Meaning |
|---|---|---|---|
| id | uuid | yes | PK |
| practitioner_id, branch_id | uuid | yes | FK |
| day_of_week | smallint | yes | 0–6 |
| start_time, end_time | time | yes | `end_time > start_time` enforced |
| effective_from | date | yes | default `current_date` |
| effective_to | date | no | null = open-ended |

**Status:** schema exists, no rows exist (no practitioners seeded), no admin UI to manage it yet.
**Consumed by:** `get_available_slots()`.

## Type: `availability_exceptions`

**Where:** `0005_availability_appointments.sql`. One-off overrides (leave, holidays, partial blocks).

| Field | Type | Required | Meaning |
|---|---|---|---|
| id | uuid | yes | PK |
| practitioner_id | uuid | yes | FK |
| date | date | yes | — |
| start_time, end_time | time | no | null = full-day exception |
| is_unavailable | boolean | yes | default `true` |
| reason | text | no | — |

**Consumed by:** `get_available_slots()` (full-day check + partial-overlap check).

## Type: `appointments`

**Where:** `0005_availability_appointments.sql`. **Never read/written directly by anon or cross-patient — see `docs/CONTRACTS.md` RPCs.**

| Field | Type | Required | Meaning | Example |
|---|---|---|---|---|
| id | uuid | yes | PK | — |
| organization_id, branch_id, patient_id, practitioner_id, service_id | uuid | yes | FKs | — |
| starts_at, ends_at | timestamptz | yes | `ends_at > starts_at` | — |
| status | text | yes | CHECK: `pending` \| `confirmed` \| `checked_in` \| `completed` \| `cancelled` \| `no_show` | "confirmed" |
| booking_source | text | yes | CHECK: `staff` \| `online` \| `phone` | "online" |
| created_by_profile_id | uuid | no | FK → profiles | — |
| notes, cancellation_reason | text | no | — | — |
| deposit_id | uuid | no | FK → booking_deposits | — |
| created_at, updated_at | timestamptz | yes | — | — |

**DB-level invariant:** `appointments_no_overlap` exclusion constraint — no two non-cancelled/no_show appointments for the same `practitioner_id` may have overlapping `tstzrange(starts_at, ends_at)`. This is the actual double-booking prevention; `get_available_slots`/`book_appointment` are the application-level layer on top.
**Produced by:** `book_appointment()` RPC only (no direct table INSERT policy issues this from the client side — the RPC is `SECURITY DEFINER`).

## Type: `booking_deposits`

**Where:** `0005_availability_appointments.sql`

| Field | Type | Required | Meaning |
|---|---|---|---|
| id | uuid | yes | PK |
| appointment_id | uuid | yes | FK |
| amount | numeric(10,2) | yes | default 0 |
| currency | text | yes | default `'BDT'` |
| status | text | yes | CHECK: `not_required` \| `pending` \| `paid` \| `refunded` \| `waived` |
| payment_reference | text | no | — |

**Status:** schema exists, unused — no payment gateway wired (deliberately deferred per the build plan).

## Type: `invoices`

**Where:** `0006_billing.sql`

| Field | Type | Required | Meaning |
|---|---|---|---|
| id | uuid | yes | PK |
| organization_id, patient_id | uuid | yes | FK |
| appointment_id | uuid | no | FK |
| invoice_number | text | yes | unique per org |
| issue_date | date | yes | default `current_date` |
| due_date | date | no | — |
| status | text | yes | CHECK: `draft` \| `issued` \| `partially_paid` \| `paid` \| `void` |
| subtotal, tax_amount, discount_amount, total | numeric(10,2) | yes | default 0 |
| notes | text | no | — |
| created_by_staff_id | uuid | no | FK |

**Status:** schema exists, no UI (module 6 — Invoice Management — not built).

## Type: `invoice_items`

**Where:** `0006_billing.sql`

| Field | Type | Required | Meaning |
|---|---|---|---|
| id | uuid | yes | PK |
| invoice_id | uuid | yes | FK |
| service_id | uuid | no | FK |
| description | text | yes | — |
| quantity | numeric(6,2) | yes | default 1 |
| unit_price, line_total | numeric(10,2) | yes | default 0 |

## Type: `payments`

**Where:** `0006_billing.sql`

| Field | Type | Required | Meaning |
|---|---|---|---|
| id | uuid | yes | PK |
| invoice_id | uuid | yes | FK |
| amount | numeric(10,2) | yes | `> 0` |
| method | text | yes | CHECK: `cash` \| `card` \| `bank_transfer` \| `other` |
| paid_at | timestamptz | yes | default `now()` |
| recorded_by_staff_id | uuid | no | FK |
| reference | text | no | — |

## Type: `prescriptions`

**Where:** `0007_clinical.sql`

| Field | Type | Required | Meaning |
|---|---|---|---|
| id | uuid | yes | PK |
| patient_id, practitioner_id | uuid | yes | FK |
| appointment_id | uuid | no | FK |
| issued_at | timestamptz | yes | default `now()` |
| notes | text | no | — |
| status | text | yes | CHECK: `active` \| `historical` |

**Status:** schema + RLS exist (`prescriptions_clinician_write` restricts INSERT to `dentist`/`owner_admin`), no UI (module 7 — Prescription Documentation — not built).

## Type: `prescription_items`

**Where:** `0007_clinical.sql`

| Field | Type | Required | Meaning |
|---|---|---|---|
| id | uuid | yes | PK |
| prescription_id | uuid | yes | FK |
| medicine_name | text | yes | — |
| dosage, frequency, duration, instructions | text | no | — |

## Type: `odontogram_entries`

**Where:** `0007_clinical.sql`. **Event-sourced like `medical_history`** — UI renders `is_current=true` rows only, history preserved for a future treatment-timeline view.

| Field | Type | Required | Meaning | Example |
|---|---|---|---|---|
| id | uuid | yes | PK | — |
| patient_id | uuid | yes | FK | — |
| chart_type | text | yes | CHECK: `adult` \| `child`, default `adult` | — |
| tooth_number | text | yes | FDI notation | "11", "48" |
| surface | text | no | reserved for future tooth-surface-level charting | — |
| status | text | yes | CHECK: `healthy` \| `existing_treatment` \| `planned_treatment` \| `completed_treatment` \| `missing` \| `other` | — |
| condition_note | text | no | — | — |
| recorded_by_practitioner_id | uuid | yes | FK → practitioners | — |
| appointment_id | uuid | no | FK | — |
| recorded_at | timestamptz | yes | default `now()` | — |
| is_current | boolean | yes | default `true` | — |

**Status:** schema + RLS exist (clinician-write only), no UI (module 8 — Basic Dental Odontogram — not built).

## Type: `notifications_log`

**Where:** `0008_notifications_audit.sql`

| Field | Type | Required | Meaning |
|---|---|---|---|
| id | uuid | yes | PK |
| organization_id, patient_id | uuid | yes | FK |
| appointment_id | uuid | no | FK |
| channel | text | yes | CHECK: `email` \| `sms` |
| type | text | yes | CHECK: `booking_confirmation` \| `reschedule_notice` \| `cancellation_notice` \| `reminder` |
| status | text | yes | CHECK: `queued` \| `sent` \| `failed`, default `queued` |
| sent_at | timestamptz | no | — |
| provider_message_id, error_message | text | no | — |

**Status:** schema exists, no producer yet (module 9 — Confirmation & Reminders — not built, no Edge Function deployed).

## Type: `audit_log`

**Where:** `0008_notifications_audit.sql`. Insert-only, written exclusively by `private.audit_log()` trigger.

| Field | Type | Required | Meaning |
|---|---|---|---|
| id | uuid | yes | PK |
| organization_id | uuid | no | resolved by the trigger (direct column or via `patient_id` lookup) |
| actor_profile_id | uuid | no | `auth.uid()` at write time |
| action | text | yes | `insert` \| `update` \| `delete` (lowercased `TG_OP`) |
| entity_type | text | yes | `TG_TABLE_NAME` |
| entity_id | uuid | yes | the row's `id` |
| before, after | jsonb | no | full row snapshots |
| created_at | timestamptz | yes | default `now()` |

**Trigger attached to:** `patients`, `appointments`, `invoices`, `payments`, `prescriptions`, `odontogram_entries`, `medical_history` (see `0009_rls_policies.sql`, bottom section).
**Read access:** `owner_admin` only, via `audit_log_owner_read` policy.

---

## Non-table types

### Type: `Database` (TypeScript)
**Where:** `src/types/database.types.ts` — generated via `npx supabase gen types typescript --linked` against the live schema (1421 lines, all 22 tables + `graphql_public` schema stub). Regenerate after any migration change.

### Type: `AuthActionState` (TypeScript)
**Where:** `src/lib/server/auth.ts`
```ts
type AuthActionState = { error: string | null; message?: string };
```
**Consumed by:** every `useActionState` call in `src/components/auth/*` and `src/components/portal/registration-form.tsx`.

### Env vars
**Where:** `.env.local` (gitignored), documented in `.env.local.example`

| Var | Exposed to browser? | Meaning |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | `https://mxywvlekwgrzlewxgfcl.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | RLS-enforced client key (current Supabase key format, replaces legacy `anon` JWT) |
| `SUPABASE_SECRET_KEY` | **no** | bypasses RLS; used only in `src/lib/supabase/admin.ts` (current format, replaces legacy `service_role` JWT) |
