# Glossary

> **2026-08-14 delivery note:** References below to an unbuilt odontogram or placeholder modules describe an older snapshot. Those interfaces are implemented in the current delivery.

## Basic tier (Basic Plan)

**Definition:** The launch scope this entire codebase implements — 9 core modules for a single clinic (1 branch, ≤2 practitioners): Complete Clinic Website, Central Patient Profile, Appointment Scheduler, Basic Online Booking, Digital Registration, Invoice Management, Prescription Documentation, Basic Dental Odontogram, Confirmation & Reminders. Part of a 3-tier roadmap (Basic → Medium → Advanced) defined in client proposal documents outside this repo; the schema is deliberately future-proofed (e.g. `organizations`/`branches` tables exist now) so later tiers don't require re-architecture.

**Where:** `supabase/migrations/0002_core_org.sql` (org/branch tables exist for this reason).

## Base UI

**Definition:** The headless component primitive library this project's shadcn/ui components are built on (`@base-ui/react`), **not Radix UI**. Composition uses a `render` prop (`useRender` hook) instead of Radix's `asChild` + `Slot` pattern. This matters when adding/modifying any `src/components/ui/*` file — Radix-era shadcn examples found online won't match this codebase's API.

**Where:** `src/components/ui/button.tsx` (imports `Button as ButtonPrimitive` from `@base-ui/react/button`), `src/components/ui/form.tsx` (hand-written using `useRender`/`mergeProps` from `@base-ui/react`).

## `CONTAINER` (layout constant)

**Definition:** The shared Tailwind class string enforcing this project's full-bleed section layout rule: the outer `<section>` background always spans the full viewport width; only the inner content wrapper (this constant) is constrained, and it's kept wide (`max-w-[1400px]`) with modest padding rather than a narrow centered column. Adopted directly from two reference sites the client pointed to (effytechbd.com, dhakaheights.com).

**Where:** `src/lib/layout.ts`.

## `private` schema

**Definition:** A non-exposed Postgres schema (not reachable via Supabase's Data API, which only exposes `public` by default) holding every RLS helper function (`current_org_id`, `current_role`, `is_staff`, `is_clinician`, `current_patient_id`, `branch_in_org`, `practitioner_in_org`, `audit_log` trigger function). Created specifically in response to a `supabase-postgres-best-practices` skill review flagging that these helpers previously lived in `public` without schema isolation.

**Where:** `supabase/migrations/0009_rls_policies.sql`, top section.

## RLS (Row Level Security)

**Definition:** The sole per-row access control mechanism in this app — there is no application-level authorization layer. Every table has RLS enabled; policies are written per-role (`anon`, `authenticated`) using `TO` clauses and ownership predicates (e.g. `patient_id = private.current_patient_id()`). Verified live this session via real signups: a second patient's row was confirmed invisible to the first patient's authenticated session.

**Where:** `supabase/migrations/0009_rls_policies.sql`.

## SECURITY DEFINER function

**Definition:** A Postgres function that executes with its creator's privileges rather than the caller's, used here for two purposes: (1) RLS helper functions in the `private` schema that need to read `profiles`/`patients` regardless of the calling role's own RLS visibility, and (2) the two public RPCs (`get_available_slots`, `book_appointment`) that deliberately need to read across the `appointments` table (which has no direct anon/patient SELECT policy) without exposing raw rows. Every such function in this codebase re-derives identity from `auth.uid()` internally rather than trusting caller-supplied IDs, per the security checklist in the `supabase` skill.

**Where:** `supabase/migrations/0009_rls_policies.sql`.

## `is_current` flag (versioned/event-sourced tables)

**Definition:** The pattern used by `medical_history` and `odontogram_entries`: rows are never UPDATEd, only inserted with an incrementing `version` (medical_history) or a new timestamp (odontogram_entries), with exactly one row per `(patient_id[, tooth_number])` flagged `is_current=true`. Gives a full audit trail without extra schema, at the cost of the application needing to flip the previous row's flag when inserting a new one (not yet implemented anywhere — only version 1 / first-entry inserts exist so far).

**Where:** `supabase/migrations/0004_patients.sql` (`medical_history`), `0007_clinical.sql` (`odontogram_entries`).

## FDI notation

**Definition:** The two-digit tooth-numbering system (`11`–`48`) used in `odontogram_entries.tooth_number`, standard in dental charting outside North America. Not yet rendered by any UI (module 8 unbuilt).

**Where:** `supabase/migrations/0007_clinical.sql` column comment.

## Exclusion constraint (double-booking prevention)

**Definition:** The Postgres `EXCLUDE USING gist` constraint (`appointments_no_overlap`) that makes it structurally impossible for the same practitioner to have two overlapping non-cancelled appointments, enforced by the database itself regardless of what application code does. Requires the `btree_gist` extension (see `0001_extensions.sql`, relocated out of `public` in `0010_extension_schema_fix.sql`).

**Where:** `supabase/migrations/0005_availability_appointments.sql`.

## Publishable key / Secret key

**Definition:** Supabase's current API key format (replacing the legacy `anon`/`service_role` JWTs, which remain valid but are being phased out). This project uses the current format exclusively: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (client-safe, RLS-enforced) and `SUPABASE_SECRET_KEY` (server-only, bypasses RLS).

**Where:** `.env.local.example`, `src/lib/supabase/{client,server,admin}.ts`.

## Route group

**Definition:** Next.js App Router convention (`(name)` directory) used here to separate the app into four audiences without affecting the URL: `(marketing)` (public, no prefix), `(auth)` (public, no prefix), `(staff)` (prefix-less but guarded by `requireStaff()` in its layout), `(portal)` (URL-prefixed `/portal/*`, guarded by `requirePatient()`).

**Where:** `src/app/(marketing)/`, `src/app/(auth)/`, `src/app/(staff)/`, `src/app/(portal)/`.

## `ComingSoon`

**Definition:** The shared placeholder component rendered by every route belonging to an unbuilt module (scheduler, invoices, prescriptions, patient directory, portal appointments/invoices/prescriptions). Not a 404 — the route and its guard exist, only the feature body is a stub.

**Where:** `src/components/shared/coming-soon.tsx`.
