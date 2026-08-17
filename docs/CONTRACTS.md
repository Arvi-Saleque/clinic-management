# Contracts

> **2026-08-14 delivery note:** This contract inventory predates the premium workspace upgrade. Routes described as placeholders may now be complete; the source code and root `README.md` are authoritative.

Every route, Server Action, and RPC in the current codebase. "Request/response" for pages means the rendered page's behavior, not a JSON API (this is a server-rendered app, not a REST backend — the real API surface is Supabase PostgREST + the two custom RPCs at the bottom).

## Pages — `(marketing)` route group

### Contract: Home — `GET /`
**Status:** BUILT
**Where:** `src/app/(marketing)/page.tsx`
**Behavior:** Renders `Hero`, `TrustStrip`, `ServicesGrid`, `PractitionersSection`, `TestimonialCarousel`, `BookingCtaBand` — all static/mock data, no DB reads.

### Contract: Book — `GET /book`
**Status:** BUILT
**Where:** `src/app/(marketing)/book/page.tsx`
**Behavior:** Server Component, calls `getUser()`. Signed-in users are redirected straight to `/portal/appointments/book`; signed-out users see sign-up/sign-in CTAs.

### Contract: About / Services / Practitioners / Contact — `GET /about`, `/services`, `/practitioners`, `/contact`
**Status:** PLANNED
**Where:** linked from `src/components/marketing/site-header.tsx` and `site-footer.tsx`, but **no route file exists** — these currently 404.

---

## Pages — `(auth)` route group

| Route | Status | Where | Behavior |
|---|---|---|---|
| `GET /login` | BUILT | `src/app/(auth)/login/page.tsx` | Renders `LoginForm` |
| `GET /sign-up` | BUILT | `src/app/(auth)/sign-up/page.tsx` | Renders `SignUpForm` |
| `GET /forgot-password` | BUILT | `src/app/(auth)/forgot-password/page.tsx` | Renders `ForgotPasswordForm` |
| `GET /reset-password` | BUILT | `src/app/(auth)/reset-password/page.tsx` | Renders `ResetPasswordForm` (reached via the email link Supabase sends) |

---

## Pages — `(staff)` route group (guarded by `requireStaff()`)

| Route | Status | Where |
|---|---|---|
| `GET /dashboard` | BUILT (stats are placeholders) | `src/app/(staff)/dashboard/page.tsx` |
| `GET /patients` | PLANNED (`ComingSoon`) | `src/app/(staff)/patients/page.tsx` |
| `GET /scheduler` | BUILT (verified live) | `src/app/(staff)/scheduler/page.tsx` — practitioner/date toolbar, day appointment list, new-appointment dialog |
| `GET /billing/invoices` | PLANNED (`ComingSoon`) | `src/app/(staff)/billing/invoices/page.tsx` |

Unauthenticated or wrong-role access → redirect to `/login` (if signed out) or `/portal/dashboard` (if signed in as a patient). Verified live this session via curl (`/dashboard` → 200 final URL `/login`).

---

## Pages — `(portal)` route group (guarded by `requirePatient()`)

| Route | Status | Where |
|---|---|---|
| `GET /portal/dashboard` | BUILT | `src/app/(portal)/portal/dashboard/page.tsx` |
| `GET /portal/register` | BUILT | `src/app/(portal)/portal/register/page.tsx` — renders `RegistrationForm` |
| `GET /portal/profile` | BUILT (read-only) | `src/app/(portal)/portal/profile/page.tsx` — shows a "complete registration first" card if no `patients` row exists yet |
| `GET /portal/appointments` | BUILT (verified live) | `src/app/(portal)/portal/appointments/page.tsx` — list via `listOwnAppointments()`, cancel via `AppointmentCard` |
| `GET /portal/appointments/book` | BUILT (verified live) | `src/app/(portal)/portal/appointments/book/page.tsx` — renders `BookingWizard` (service → practitioner → slot → confirm) |
| `GET /portal/invoices` | PLANNED (`ComingSoon`) | `src/app/(portal)/portal/invoices/page.tsx` |
| `GET /portal/prescriptions` | PLANNED (`ComingSoon`) | `src/app/(portal)/portal/prescriptions/page.tsx` |

---

## Server Actions (`src/lib/server/`)

All follow the same shape: `(prevState: AuthActionState, formData: FormData) => Promise<AuthActionState>`, bound via `useActionState` in a Client Component, where `AuthActionState = { error: string | null; message?: string }`.

### Contract: `signInAction`
**Status:** BUILT (verified live)
**Where:** `src/lib/server/auth.ts`
**Request (FormData):** `email`, `password`
**Response (success):** `redirect("/portal/dashboard")` or `redirect("/dashboard")` depending on `profiles.role`
**Response (errors):** `{error: "<zod message>"}` on validation failure; `{error: "<Supabase auth error message>"}` on bad credentials

### Contract: `signUpAction`
**Status:** BUILT (verified live — real signup tested, trigger confirmed to fire)
**Where:** `src/lib/server/auth.ts`
**Request (FormData):** `fullName`, `email`, `password` (min 8 chars)
**Response (success, email confirmation OFF):** `redirect("/portal/register")`
**Response (success, email confirmation ON — this project's actual live config):** `{error: null, message: "Check your email to confirm your account before signing in."}`
**Response (errors):** `{error: "<zod message>"}` | `{error: "<Supabase error>"}`
**Side effect:** `public.handle_new_user()` trigger fires on the resulting `auth.users` insert, creating a `profiles` row with `role='patient'`.

### Contract: `signOutAction`
**Status:** BUILT
**Where:** `src/lib/server/auth.ts`
**Request:** none (no-arg form action)
**Response:** `redirect("/")`

### Contract: `forgotPasswordAction`
**Status:** BUILT
**Where:** `src/lib/server/auth.ts`
**Request (FormData):** `email`
**Response:** always `{error: null, message: "If that email has an account, a reset link is on its way."}` (Supabase's `resetPasswordForEmail` doesn't leak whether the email exists) or `{error: "<message>"}` on transport failure. `redirectTo` param: `${origin}/reset-password`.

### Contract: `resetPasswordAction`
**Status:** BUILT
**Where:** `src/lib/server/auth.ts`
**Request (FormData):** `password`, `confirmPassword` (must match, zod `.refine`)
**Response (success):** `redirect("/login")`
**Response (errors):** `{error: "<zod or Supabase message>"}`

### Contract: `registerPatientAction`
**Status:** BUILT (verified live)
**Where:** `src/lib/server/registration.ts`
**Request (FormData):** `phone`, `dob`, `gender?`, `address?`, `emergencyContactName`, `emergencyContactPhone`, `allergies` (comma-separated), `currentMedications` (comma-separated), `chronicConditions` (comma-separated), `pastSurgeries?`, `notes?`
**Response (success):** `redirect("/portal/dashboard")`. Sequentially inserts: `patients` (1 row) → `medical_history` (version 1, `source='digital_intake'`) → `registration_submissions` (`raw_payload` = the parsed input as jsonb, `status='pending_review'`).
**Response (errors):**
| Condition | Message |
|---|---|
| zod validation fails | first issue message |
| not signed in | "You must be signed in to register." |
| profile/org lookup fails | "Could not load your account. Please try again." |
| `patients` insert fails, unique violation (`23505`) | "You've already completed registration." |
| `patients` insert fails, other | "Could not save your details. Please try again." |
| `medical_history` insert fails | "Could not save your medical history. Please try again." |
| `registration_submissions` insert fails | "Could not submit your registration. Please try again." |

### Contract: `getAvailableSlots` / `createStaffAppointment` / `updateAppointmentStatus`
**Status:** BUILT (verified live)
**Where:** `src/lib/server/appointments.ts`
**Behavior:** thin wrappers around the `get_available_slots`/`book_appointment` RPCs (below) and a direct `appointments` table UPDATE (status only) gated by `requireStaff()`. `createStaffAppointment` always passes `bookingSource: "staff" | "phone"`. Not `AuthActionState`-shaped — return `{slots, error}` / `{id, error}` / `{error}` respectively, called directly from Client Components (not via `useActionState`, since the scheduler UI drives them from button `onClick`, not form submission).

### Contract: `bookOwnAppointmentAction` / `cancelOwnAppointmentAction`
**Status:** BUILT (verified live)
**Where:** `src/lib/server/booking.ts`
**Request:** `bookOwnAppointmentAction({practitionerId, serviceId, branchId, startsAt})` — resolves the caller's own `patients.id` server-side (never trusts a client-supplied patient id), then calls `book_appointment` with `booking_source: "online"`.
**Response (success):** `redirect("/portal/appointments")`
**Response (errors):** `{error: "Please complete your registration before booking."}` if no `patients` row yet; otherwise the RPC's error message.
`cancelOwnAppointmentAction(appointmentId, reason?)` calls the `cancel_appointment` RPC; returns `{error: string | null}`.

---

## Supabase RPCs (PostgREST, callable via `supabase.rpc(...)` or `POST /rest/v1/rpc/<name>`)

### Contract: `get_available_slots`
**Status:** BUILT (verified live — real practitioner + availability_rules created, returns correct 15-minute-interval slots in the practitioner's branch timezone)
**Where:** `supabase/migrations/0009_rls_policies.sql`
**Grant:** `anon`, `authenticated` (intentionally public — flagged by `supabase db advisors` as expected)
**Request:**
```json
{ "p_practitioner_id": "uuid", "p_service_id": "uuid", "p_date": "2026-08-15" }
```
**Response (success):**
```json
[{ "slot_start": "2026-08-15T10:00:00+00:00", "slot_end": "2026-08-15T10:30:00+00:00" }]
```
**Response (errors):** none thrown — returns `[]` for any input that resolves to no valid slots (unknown practitioner/service, full-day exception, etc.).
**Never exposes:** which appointment/patient occupies a slot — only free windows.

### Contract: `book_appointment`
**Status:** BUILT (verified live — both staff `booking_source:"phone"` and patient `booking_source:"online"` paths tested; double-booking the same slot correctly rejected and the slot disappears from `get_available_slots` immediately after)
**Where:** `supabase/migrations/0009_rls_policies.sql`
**Grant:** `authenticated` only
**Request:**
```json
{
  "p_practitioner_id": "uuid", "p_service_id": "uuid", "p_branch_id": "uuid",
  "p_patient_id": "uuid", "p_starts_at": "2026-08-15T10:00:00Z",
  "p_booking_source": "online", "p_notes": null
}
```
**Response (success):** new `appointments.id` (uuid)
**Response (errors — raised as Postgres exceptions, surfaced as PostgREST 400s):**
| Condition | Message |
|---|---|
| `p_booking_source='online'` but `p_patient_id` isn't the caller's own patient row | "A patient may only book an appointment for themselves" |
| `p_booking_source` is `staff`/`phone` but caller isn't staff | "Only clinic staff may create staff/phone bookings" |
| unknown `p_service_id` | "Unknown service" |
| slot no longer free (re-validated server-side against `get_available_slots`) | "That time is no longer available — please pick another slot" |

### Contract: `cancel_appointment`
**Status:** BUILT (verified live)
**Where:** `supabase/migrations/0013_cancel_appointment_rpc.sql`
**Grant:** `authenticated` only
**Why it exists:** replaces a prior `appointments_self_update` RLS policy that gave a patient blanket UPDATE on their own appointment row (any column, any status transition) — found and fixed while building the patient booking flow. Verified live: a direct `PATCH /rest/v1/appointments` attempting `{"status":"completed"}` as the owning patient now returns `200 []` (RLS silently blocks it, 0 rows affected) instead of succeeding.
**Request:**
```json
{ "p_appointment_id": "uuid", "p_reason": "Cancelled by patient" }
```
**Response (success):** `204 No Content`
**Response (errors — Postgres exceptions, PostgREST 400s):**
| Condition | Message |
|---|---|
| appointment doesn't exist | "Appointment not found" |
| caller is neither the owning patient nor staff | "You are not permitted to cancel this appointment" |
| appointment status isn't `pending`/`confirmed` | "This appointment can no longer be cancelled" |
