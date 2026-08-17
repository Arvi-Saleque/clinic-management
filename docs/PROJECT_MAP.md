# Clinic Care (website-code) — Project Map

> Last verified: 2026-08-10. Source-of-truth: working tree (uncommitted — only `1a7b48f "Initial commit from Create Next App"` exists in git history; all application code below is uncommitted local work).

## What this is

A Next.js 16 (App Router) + Supabase application implementing the **Basic-tier launch scope** of a clinic management system: a public marketing website, a staff-facing clinic operations app, and a patient self-service portal, all backed by one Postgres database with Row Level Security as the sole per-row access boundary.

Current state: foundation is live and verified end-to-end against a real hosted Supabase project (`mxywvlekwgrzlewxgfcl`, region `ap-northeast-2`). Auth (sign-up/login/password reset), role-based routing, and the patient self-registration flow (creates `patients` + `medical_history` + `registration_submissions` rows) are built and tested with real signups against the live DB, including a cross-patient RLS isolation test. The marketing homepage is fully built with a custom motion/theming system. Scheduling, online booking, invoicing, prescriptions, and the dental odontogram are **schema-complete but have no UI yet** — their pages currently render a `ComingSoon` placeholder.

Scope: single clinic, single organization row, dental-first but not dental-only (schema is specialty-agnostic at the core). Multi-branch, CRM, membership billing, and advanced dental charting are explicitly out of scope for this build (see `supabase/migrations/0002_core_org.sql` — `organizations`/`branches` tables exist now specifically so those tiers don't require re-architecture later).

## Layer / module ownership

| Layer | Owns | Must not own |
|---|---|---|
| `src/app/(marketing)/` | Public site: home, services, practitioners, contact, `/book` | Auth logic, DB writes beyond read-only public catalogue queries |
| `src/app/(auth)/` | Sign in/up, password reset UI | Role-based redirects (delegated to `lib/auth/guards.ts`) |
| `src/app/(staff)/` | Owner/receptionist/dentist workspace (dashboard, patients, scheduler, billing) | Patient-only data access (RLS blocks this regardless) |
| `src/app/(portal)/` | Patient self-service (dashboard, register, appointments, invoices, prescriptions, profile) | Staff-only data access (RLS blocks this regardless) |
| `src/lib/supabase/` | Three Supabase client variants: browser, server (cookie-bound), admin (secret key) | Business logic — these are transport only |
| `src/lib/server/` | Server Actions (`"use server"`): auth, registration | Rendering — actions return `{error, message}` state, never JSX |
| `src/lib/auth/` | Session/profile lookup (`session.ts`) and role-gate redirects (`guards.ts`) | Direct Supabase queries outside the `profiles` table |
| `src/components/motion/` | 7 reusable Framer Motion primitives (see `docs/MODULE_INDEX.md`) | Any business logic or data fetching |
| `src/components/theme/` | Light/dark mode + swappable brand-color token system | Component styling decisions (components consume tokens, don't own them) |
| `supabase/migrations/` | All schema, RLS policies, triggers, RPCs — the only source of truth for the DB shape | — |
| `supabase/seed.sql` | Demo data: 1 org, 1 branch, opening hours, 4 services | Practitioner/staff/patient rows (these require real `auth.users` rows — see `docs/DATA_DICTIONARY.md` note on `profiles`) |

## How the layers talk (hop table)

| From → To | Protocol | Payload shape | Gate / env var | Code path | Status |
|---|---|---|---|---|---|
| Browser → Next.js Server Components | HTTP (SSR) | HTML | — | `src/app/**/page.tsx` | BUILT |
| Client Component → Server Action | Next.js RPC (form action / `useActionState`) | `FormData` in, `{error, message?}` out | — | `src/lib/server/auth.ts`, `src/lib/server/registration.ts` | BUILT |
| Server Component/Action → Supabase Postgres | PostgREST over HTTPS, cookie-scoped session | JSON | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `src/lib/supabase/server.ts` | BUILT |
| Admin/seed scripts → Supabase Postgres | PostgREST, secret key (bypasses RLS) | JSON | `SUPABASE_SECRET_KEY` (server-only, never `NEXT_PUBLIC_`) | `src/lib/supabase/admin.ts` | BUILT |
| `middleware.ts` → Supabase Auth | Cookie refresh on every request | — | same Supabase env vars | `middleware.ts` | BUILT |
| Public/patient client → `get_available_slots()` RPC | PostgREST RPC, `anon`+`authenticated` | `{practitioner_id, service_id, date}` → `{slot_start, slot_end}[]` | none (public by design) | `supabase/migrations/0009_rls_policies.sql` | BUILT-SIMULATED (no practitioners/availability_rules seeded yet, so returns `[]` against live data) |
| Patient client → `book_appointment()` RPC | PostgREST RPC, `authenticated` only | booking params → new appointment `id` | re-validates slot server-side | `supabase/migrations/0009_rls_policies.sql` | BUILT-SIMULATED (no UI calls it yet — module 4 not built) |
| `auth.users` insert → `profiles` row | Postgres trigger | — | `public.handle_new_user()` | `supabase/migrations/0011_handle_new_user.sql` | BUILT (verified live) |

## Where to start when you don't know the codebase

1. `docs/MODULE_INDEX.md` — what every directory does, in one page.
2. `supabase/migrations/0001` through `0012`, in order — the entire data model, read as a story (org → people → scheduling → billing → clinical → governance → auth).
3. `src/app/(marketing)/page.tsx` — simplest full-stack example: server component rendering `src/components/marketing/*`, all built on the motion primitives.
4. `src/lib/server/registration.ts` — the fullest example of the write path: Server Action → validate (zod) → sequential Supabase inserts → redirect. Same shape every future module (billing, prescriptions, scheduler) will follow.
5. `supabase/migrations/0009_rls_policies.sql` — the security model. Read this before touching any table's access rules.

## Where NOT to start

- `.agents/skills/` and `.claude/skills/` — third-party agent tooling (Supabase skill, `analyze-repo`, etc.), not application code.
- `src/lib/mock-data.ts` — placeholder content for the marketing site (services/practitioners/testimonials) until real Supabase-backed pages replace it. Don't treat it as the data model; see `supabase/migrations/0003_practitioners_services.sql` for the real shape.
- `public/*.svg` — unused `create-next-app` default assets, not yet replaced with real branding.

## Last verified

2026-08-10 by analyze-repo skill. Code state: branch `master`, working tree (uncommitted), last commit `1a7b48f`.
