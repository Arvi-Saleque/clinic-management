# Module Index

> **2026-08-14 delivery note:** This is a historical repository scan. The premium scheduler, patient directory, invoicing, prescriptions, and odontogram are now implemented; see the root `README.md` for current status.

## Module: `supabase/migrations/`

**Job:** Entire database schema, RLS policies, triggers, and RPCs — the single source of truth for data shape. Applied via `supabase db push --linked`.

**Key files:**
- `0001_extensions.sql` — `pgcrypto`, `btree_gist` (double-booking exclusion constraint support)
- `0002_core_org.sql` — `organizations`, `branches`, `opening_hours`, `profiles`
- `0003_practitioners_services.sql` — `practitioners`, `services`, `practitioner_services`
- `0004_patients.sql` — `patients`, `family_links`, `medical_history` (versioned), `registration_submissions`
- `0005_availability_appointments.sql` — `availability_rules`, `availability_exceptions`, `appointments` (with `appointments_no_overlap` exclusion constraint), `booking_deposits`
- `0006_billing.sql` — `invoices`, `invoice_items`, `payments`
- `0007_clinical.sql` — `prescriptions`, `prescription_items`, `odontogram_entries`
- `0008_notifications_audit.sql` — `notifications_log`, `audit_log`
- `0009_rls_policies.sql` — `private` schema helper functions, RLS policies on all 22 public tables, `public.get_available_slots()`, `public.book_appointment()`, generic `private.audit_log()` trigger
- `0010_extension_schema_fix.sql` — moves `btree_gist` out of `public` (db-advisors finding)
- `0011_handle_new_user.sql` — `public.handle_new_user()` trigger: auto-creates a `profiles` row (role=`patient`) on `auth.users` insert
- `0012_patient_self_registration.sql` — adds the `patients`/`medical_history` self-INSERT policies a patient needs during registration

**Public API:** every table + `get_available_slots(uuid, uuid, date)` + `book_appointment(uuid, uuid, uuid, uuid, timestamptz, text, text)`, callable via Supabase PostgREST.

**Depends on:** none (this is the foundation layer).

**Depended on by:** every `src/lib/supabase/*` client, every Server Action, every page that queries data.

**Tests:** no automated test suite. Verified manually via live REST API calls during this session (patient self-insert, cross-patient isolation, anon RPC access) — not repeatable/CI-integrated. See `docs/TEST_LANDSCAPE.md`.

---

## Module: `src/lib/supabase/`

**Job:** The only place Supabase clients are constructed. Three variants for three trust levels.

**Key files:**
- `client.ts` — `createClient()`, browser-side, publishable key, RLS-enforced. Use in Client Components.
- `server.ts` — `createClient()` (async), cookie-bound via `@supabase/ssr`, RLS-enforced as the signed-in user. Use in Server Components/Actions/Route Handlers.
- `admin.ts` — `createAdminClient()`, secret key, bypasses RLS entirely. Guarded by the `server-only` import (build fails if bundled into client code). Use sparingly.

**Public API:** `createClient()` (browser), `createClient()` (server, async), `createAdminClient()`.

**Depends on:** `@supabase/ssr`, `@supabase/supabase-js`, `src/types/database.types.ts`, env vars `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY`.

**Depended on by:** `middleware.ts`, every file in `src/lib/server/`, `src/lib/auth/session.ts`, several portal pages that query directly (e.g. `src/app/(portal)/portal/profile/page.tsx`).

**Tests:** none automated.

---

## Module: `src/lib/auth/`

**Job:** Session/role resolution and route-guard redirects — the enforcement point for role-based access at the page layer (RLS is the DB-level enforcement; this is the UX-level one).

**Key files:**
- `session.ts` — `getUser()` (verified against Supabase Auth servers), `getProfile()` (fetches the `profiles` row for the current user)
- `guards.ts` — `requireRole(allowed: Role[])`, `requireStaff()`, `requirePatient()`. Redirects to `/login` if signed out, or to the correct home (`/dashboard` vs `/portal/dashboard`) if signed in with the wrong role.

**Public API:** `getUser`, `getProfile`, `requireRole`, `requireStaff`, `requirePatient`.

**Depends on:** `src/lib/supabase/server.ts`, `src/lib/constants/roles.ts`, `next/navigation` (`redirect`).

**Depended on by:** `src/app/(staff)/layout.tsx` (calls `requireStaff()`), `src/app/(portal)/layout.tsx` (calls `requirePatient()`), several pages call `getUser`/`getProfile` directly for display.

**Tests:** manually verified — signed-out access to `/dashboard` and `/portal/dashboard` both redirect to `/login` (curl-tested this session).

---

## Module: `src/lib/server/`

**Job:** All Server Actions (`"use server"`). Each validates `FormData` with a zod schema, calls Supabase, and returns `{error: string | null, message?: string}` for `useActionState` consumers, or calls `redirect()` on success.

**Key files:**
- `auth.ts` — `signInAction`, `signUpAction`, `signOutAction`, `forgotPasswordAction`, `resetPasswordAction`. Exports `AuthActionState` type reused by other action modules.
- `registration.ts` — `registerPatientAction`: creates `patients` + `medical_history` + `registration_submissions` rows for the current authenticated patient.
- `appointments.ts` — `getAvailableSlots`, `createStaffAppointment` (`requireStaff()`-gated), `updateAppointmentStatus` (`requireStaff()`-gated). The shared availability engine — called by both the staff scheduler and (via `directory.ts`/`booking.ts`) the patient booking wizard.
- `directory.ts` — read helpers: `listPractitioners`, `listServices`, `searchPatients`, `listAppointmentsForDay` (staff), `listOwnAppointments` (patient, resolves own `patients.id` from `auth.uid()` first).
- `booking.ts` — `bookOwnAppointmentAction`, `cancelOwnAppointmentAction`: the patient-facing booking/cancel actions. Both resolve identity server-side and never trust a client-supplied patient id.

**Public API:** the five auth actions + `registerPatientAction` + the appointments/directory/booking functions above, consumed via `<form action={...}>`/`useActionState` (auth, registration) or direct calls from Client Components (scheduler, booking wizard — these use button `onClick`, not form submission, so they return plain `{data, error}` shapes rather than `AuthActionState`).

**Depends on:** `src/lib/supabase/server.ts`, `src/lib/validation/*`, `src/lib/auth/guards.ts` (`appointments.ts`), `next/navigation`, `next/headers`, `next/cache` (`revalidatePath`).

**Depended on by:** `src/components/auth/*-form.tsx`, `src/components/portal/{registration-form,booking-wizard,appointment-card}.tsx`, `src/components/staff/{new-appointment-dialog,appointment-list}.tsx`, `src/components/shared/sign-out-button.tsx`.

**Tests:** manually verified live — see `docs/TEST_LANDSCAPE.md` for the full list (signup/trigger/RLS isolation, staff + patient booking, double-booking rejection, the `cancel_appointment` security fix, cross-patient cancel rejection).

---

## Module: `src/lib/validation/`

**Job:** zod schemas + `FormData` parsers, one file per domain.

**Key files:**
- `auth.ts` — `loginSchema`, `signUpSchema`, `forgotPasswordSchema`, `resetPasswordSchema`
- `registration.ts` — `registrationSchema` + `parseRegistrationFormData(formData)` (handles CSV-to-array fields: allergies, medications, conditions)

**Public API:** the schemas + `parseRegistrationFormData`.

**Depends on:** `zod`.

**Depended on by:** `src/lib/server/auth.ts`, `src/lib/server/registration.ts`.

---

## Module: `src/components/motion/`

**Job:** 7 reusable Framer Motion primitives — the entire "wow factor" toolkit for the marketing site. Every one respects `prefers-reduced-motion` and is pointer-only where relevant (no jank on touch).

**Key files:**
- `scroll-reveal.tsx` — `<ScrollReveal>`: fade/slide-up on scroll into view
- `stagger-group.tsx` — `<StaggerGroup>` + `<StaggerItem>`: cascading grid/list entrance
- `tilt-card.tsx` — `<TiltCard>`: mouse-position-driven 3D tilt (spring-smoothed)
- `glass-panel.tsx` — `<GlassPanel>`: static frosted-glass surface (backdrop-blur), `tone="on-dark" | "on-light"`
- `magnetic-button.tsx` — `<MagneticButton>`: cursor-proximity pull effect, wraps a CTA
- `animated-counter.tsx` — `<AnimatedCounter>`: counts up on scroll-into-view
- `parallax-layer.tsx` — `<ParallaxLayer>`: scroll-linked background offset
- `index.ts` — barrel export for all of the above

**Public API:** all 7 components, imported as `import { X } from "@/components/motion"`.

**Depends on:** `framer-motion`, `@/lib/utils` (`cn`).

**Depended on by:** every file in `src/components/marketing/`.

**Tests:** none. Visually verified via `npm run build` + dev server curl checks this session.

---

## Module: `src/components/theme/`

**Job:** Light/dark mode + a swappable brand-color-token architecture, so a full re-skin only ever requires a new CSS file, never component edits.

**Key files:**
- `theme-provider.tsx` — wraps `next-themes` (`attribute="class"`, `defaultTheme="system"`)
- `brand-theme-provider.tsx` — `BrandThemeProvider`, `useBrandTheme()`, `BRAND_THEMES` registry (currently just `clinical-trust`); sets `data-brand` on `<html>`, persisted to `localStorage`
- `theme-toggle.tsx` — `<ThemeToggle>`: light/dark/system dropdown

**Public API:** `ThemeProvider`, `BrandThemeProvider`, `useBrandTheme`, `BRAND_THEMES`, `ThemeToggle`.

**Depends on:** `next-themes`, `src/components/ui/dropdown-menu.tsx`, `src/components/ui/button.tsx`.

**Depended on by:** `src/app/layout.tsx` (root-level providers), `src/components/marketing/site-header.tsx`, `src/components/staff/staff-shell.tsx`, `src/components/portal/portal-shell.tsx`.

**See also:** `src/styles/themes/clinical-trust.css` — the raw brand color ramp (the one file a re-skin touches), imported into `src/app/globals.css`, which maps it onto shadcn's semantic tokens (`--primary`, `--accent`, etc.) for both light and dark mode.

---

## Module: `src/components/ui/`

**Job:** shadcn/ui primitives, generated via `npx shadcn add`, built on `@base-ui/react` (not Radix — this project's shadcn version uses Base UI's `render` prop for composition instead of Radix's `asChild`+`Slot`).

**Key files:** `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `textarea.tsx`, `select.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `popover.tsx`, `calendar.tsx`, `table.tsx`, `tabs.tsx`, `avatar.tsx`, `badge.tsx`, `separator.tsx`, `skeleton.tsx`, `sonner.tsx` (toast), `form.tsx` (hand-written — the shadcn registry's `form` recipe was incomplete in this version, so this file was authored manually against `@base-ui/react/use-render` + `react-hook-form`; see file header comment).

**Public API:** standard shadcn component exports per file.

**Depends on:** `@base-ui/react`, `class-variance-authority`, `react-hook-form` (form.tsx only), `@/lib/utils`.

**Depended on by:** nearly every other component directory.

**Note for future edits:** composition uses `render={<Element />}` (Base UI), not `asChild` (Radix). E.g. `<Button render={<Link href="/x" />}>Text</Button>`.

---

## Module: `src/components/marketing/`

**Job:** The public homepage sections. Every section follows the "full-bleed section, wide-but-padded inner content" layout rule (see `src/lib/layout.ts`).

**Key files:**
- `site-header.tsx` — sticky nav, scroll-aware backdrop-blur, `ThemeToggle`, mobile menu via `DropdownMenu`
- `hero.tsx` — gradient-mesh background, parallax blobs, `GlassPanel` headline, `MagneticButton` CTA
- `trust-strip.tsx` — `AnimatedCounter` stats band
- `services-grid.tsx` — `TiltCard` grid, reads from `@/lib/mock-data` (not yet wired to `services` table)
- `practitioners-section.tsx` — `TiltCard` grid, reads from `@/lib/mock-data`
- `testimonial-carousel.tsx` — drag-swipe carousel (`AnimatePresence` + `drag="x"`)
- `booking-cta-band.tsx` — full-bleed gradient CTA band with pulsing button
- `site-footer.tsx` — link columns + contact info

**Public API:** each component, imported individually by `src/app/(marketing)/page.tsx` and `layout.tsx`.

**Depends on:** `src/components/motion/*`, `src/components/ui/*`, `src/lib/mock-data.ts`, `src/lib/layout.ts` (`CONTAINER`).

**Depended on by:** `src/app/(marketing)/page.tsx`, `src/app/(marketing)/layout.tsx`.

**Known gap:** content is hardcoded mock data, not live Supabase data — flagged in `PROJECT_MAP.md` "Where NOT to start."

---

## Module: `src/components/auth/`

**Job:** Client-side form components for each auth Server Action, using `useActionState` (React 19) and plain uncontrolled inputs (no react-hook-form — these forms are simple enough that zod server-side validation + `useActionState` error display is sufficient).

**Key files:** `login-form.tsx`, `sign-up-form.tsx`, `forgot-password-form.tsx`, `reset-password-form.tsx`.

**Public API:** `LoginForm`, `SignUpForm`, `ForgotPasswordForm`, `ResetPasswordForm`.

**Depends on:** `src/lib/server/auth.ts`, `src/components/ui/{button,input,label}.tsx`.

**Depended on by:** matching pages in `src/app/(auth)/`.

---

## Module: `src/components/staff/` and `src/components/portal/`

**Job:** Shell layouts (sidebar/nav + header) for the two authenticated app areas, plus the one built portal feature (registration form).

**Key files:**
- `staff/staff-shell.tsx` — `<StaffShell>`: sidebar nav (Dashboard/Patients/Scheduler/Billing), profile display, `SignOutButton`
- `portal/portal-shell.tsx` — `<PortalShell>`: top nav (Overview/Appointments/Invoices/Prescriptions/Profile)
- `portal/registration-form.tsx` — the digital intake form (calls `registerPatientAction`)

**Public API:** `StaffShell`, `PortalShell`, `RegistrationForm`.

**Depends on:** `src/lib/auth/session.ts` (`Profile` type), `src/components/theme/theme-toggle.tsx`, `src/components/shared/sign-out-button.tsx`.

**Depended on by:** `src/app/(staff)/layout.tsx`, `src/app/(portal)/layout.tsx`, `src/app/(portal)/portal/register/page.tsx`.

---

## Module: `src/components/shared/`

**Job:** Cross-cutting small components used by both staff and portal areas.

**Key files:**
- `sign-out-button.tsx` — form-wrapped button calling `signOutAction`
- `coming-soon.tsx` — `<ComingSoon title description>`: placeholder card for unbuilt modules (invoices, prescriptions, patients directory, portal invoices/prescriptions — scheduler and booking are now built, see below)

**Public API:** `SignOutButton`, `ComingSoon`.

**Depended on by:** every stub page listed in `docs/CONTRACTS.md` as status `PLANNED`.

---

## Module: `src/app/` (route tree)

**Job:** Next.js App Router pages, grouped by route group per audience.

| Route group | Path prefix | Guard | Real pages | Stub (`ComingSoon`) pages |
|---|---|---|---|---|
| `(marketing)` | `/` | none | `/`, `/book` | `/about`, `/services`, `/practitioners`, `/contact` — **not yet created at all** (linked from header/footer but no route file exists) |
| `(auth)` | `/login`, `/sign-up`, `/forgot-password`, `/reset-password` | none | all 4 | — |
| `(staff)` | `/dashboard`, `/patients`, `/scheduler`, `/billing/invoices` | `requireStaff()` | `/dashboard`, `/scheduler` | `/patients`, `/billing/invoices` |
| `(portal)` | `/portal/*` | `requirePatient()` | `/portal/dashboard`, `/portal/register`, `/portal/profile` (read-only), `/portal/appointments`, `/portal/appointments/book` | `/portal/invoices`, `/portal/prescriptions` |

**Depends on:** every module above.

**Tests:** manual curl checks this session (200 on public pages, redirect-to-`/login` on protected pages when signed out).

---

## Module: `src/lib/constants/roles.ts`, `src/lib/layout.ts`, `src/lib/utils.ts`, `src/lib/mock-data.ts`

**Job:** Small shared utilities.

- `constants/roles.ts` — `ROLES` object, `Role` type, `STAFF_ROLES`, `CLINICIAN_ROLES` arrays. Must stay in sync with the `profiles.role` CHECK constraint in `0002_core_org.sql`.
- `layout.ts` — `CONTAINER` class constant (`mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8`) — the full-bleed-section layout rule, applied to every marketing section's inner wrapper.
- `utils.ts` — `cn()` (clsx + tailwind-merge), shadcn-standard.
- `mock-data.ts` — placeholder `services`/`practitioners`/`testimonials`/`trustStats` for the marketing site.

**Depended on by:** widely, across marketing components and both shell components.
