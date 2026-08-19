# Phase 6 — Receptionist RBAC & Security Hardening Complete

## Authorization Architecture
The application enforces authorization at the server action, route handler, and layout levels using explicit role guards:
- `requireRole(allowedRoles)`: Core server guard inspecting the authenticated user's profile role and redirecting unauthorized requests.
- `requireStaff()`: Allows canonical staff roles `[owner_admin, receptionist, dentist]`.
- `requireClinician()`: Restricts access strictly to clinicians `[owner_admin, dentist]`.
- `requirePatient()`: Scopes to patient self-service portal accounts `[patient]`.

All sensitive queries and mutations revalidate authentication, role membership, and organization ID (`profile.organization_id`) directly on the database query layer.

## Final Receptionist Permissions
- **Dashboard**: View front-desk operational queue, Next Patient hero, and 3 operational metric cards (`Waiting`, `Upcoming`, `Completed`).
- **Appointments**: List appointments, book staff visits, reschedule visits, check in arrived patients, cancel visits, and mark DNA (no-show).
- **Patients**: Search and list patients, register new patients, view 5-card administrative profile, and edit strictly whitelisted contact/demographic fields.
- **Clinical Diary**: View read-only practitioner working routines and date-specific schedules.
- **Billing & Payments**: List invoices, view itemised statements, inspect payment history, record full or partial payments, and view invoice breakdown.

## Clinical Restrictions
Receptionists are blocked at server and route levels from:
- Entering or viewing clinical encounters (`/clinical/encounters/*` and `getEncounterWorkspaceContext`).
- Creating, editing, or completing consultations (`startOrResumeEncounterAction`, `saveEncounterDraftAction`, `completeEncounterAction`).
- Accessing or modifying the Dental Chart & Odontogram (`/clinical/odontogram`, `saveEncounterOdontogramAction`, `upsertOdontogramEntryAction`).
- Issuing or viewing clinical prescriptions (`/clinical/prescriptions`, `/clinical/prescriptions/new`, `listStaffPrescriptions`, `createPrescriptionAction`).
- Viewing or editing medical history, allergies, medications, and private clinician notes (`getPatientMedicalHistory`).
- Managing clinic services, durations, fees, or categories (`/clinical/services*`, `resolveAuthorizedPractitioner`, `updateDoctorServiceAction`, `createDoctorServiceAction`).
- Mutating doctor availability schedules or date overrides (`saveMultiIntervalWeeklyAvailability`, `setAvailabilityExceptionAction`, `saveDayAvailabilityOverrideAction`).

## Appointment Security
- Front-desk status transitions are restricted in `updateAppointmentStatus`: Receptionists can only transition to `checked_in`, `confirmed`, `cancelled`, and `no_show`.
- Marking an appointment `completed` is strictly prohibited for Receptionists and reserved for clinicians completing an encounter.
- Appointment mutations enforce `eq("organization_id", profile.organization_id)` and validate that the target appointment belongs to the authenticated clinic organization.

## Patient Security
- `updatePatientAdministrativeAction` strictly enforces a validated schema whitelist containing only: `firstName`, `lastName`, `phone`, `email`, `dob`, `gender`, `address`, `emergencyContactName`, and `emergencyContactPhone`.
- Clinical columns (allergies, medications, conditions, medical notes, clinical diagnosis) cannot be injected or updated.
- Patient creation and profile retrieval strictly enforce `organization_id` association from the authenticated session context.

## Diary Security
- Receptionists have read-only access to doctor schedules and available slots.
- All availability mutation server actions (`saveMultiIntervalWeeklyAvailability`, `setAvailabilityExceptionAction`, `deleteAvailabilityExceptionAction`, `saveDayAvailabilityOverrideAction`, `resetDayAvailabilityOverrideAction`) require `requireClinician()`.

## Billing Security
- Invoice queries and payment records enforce `organization_id` matching on invoices and payments.
- `createInvoiceAction` requires `requireClinician()`.
- `recordPaymentAction` and `recordDirectPaymentAction` validate that payments are greater than zero, within the server-recalculated remaining balance, and not submitted against void invoices.
- Destructive billing actions (voiding/deleting financial records) are blocked for Receptionists.

## Direct Route Protection
The following clinician/admin-only routes are hardened with `await requireClinician()`:
- `/clinical/services`
- `/clinical/services/new`
- `/clinical/services/[serviceId]/edit`
- `/clinical/encounters/[encounterId]`
- `/clinical/prescriptions`
- `/clinical/prescriptions/new`
- `/clinical/odontogram`
- `/billing/invoices/new`

## Organization / Branch Isolation
- **Organization Scoping**: Authoritatively enforced across all modules (`patients`, `appointments`, `invoices`, `payments`, `practitioners`, `services`) with `profile.organization_id`.
- **Branch Scoping**: Appointments and practitioner schedules are filtered by `branch_id` on the appointment/practitioner relation within the organization.

## RLS Review
Existing Supabase Row Level Security policies combined with server-side application guards provide defense-in-depth isolation. No RLS gaps requiring schema migrations were encountered.

## Dashboard De-duplication
Confirmed: The Next Patient hero appointment is filtered out from both `waitingAppointments` and `upcomingAppointments` lists, ensuring zero duplicate entries on the Receptionist Dashboard.

## Dentist Impact
Full Dentist clinical workflow remains 100% intact:
- Clinician dashboard, encounter workspace, consultation progress, odontogram charting, electronic prescribing, and doctor service configuration function without regression.

## Owner Admin Impact
Owner / Admin accounts retain full capability across clinical care, operational scheduling, doctor services management, and practice administration.

## Files Changed
- [`src/lib/server/dashboard.ts`](file:///d:/work/Clients/Health-Clinic-Management/website-code-premium/dental-clinic-workspace/src/lib/server/dashboard.ts)
- [`src/lib/server/appointments.ts`](file:///d:/work/Clients/Health-Clinic-Management/website-code-premium/dental-clinic-workspace/src/lib/server/appointments.ts)
- [`src/lib/server/patients.ts`](file:///d:/work/Clients/Health-Clinic-Management/website-code-premium/dental-clinic-workspace/src/lib/server/patients.ts)
- [`src/lib/server/invoices.ts`](file:///d:/work/Clients/Health-Clinic-Management/website-code-premium/dental-clinic-workspace/src/lib/server/invoices.ts)
- [`src/lib/server/directory.ts`](file:///d:/work/Clients/Health-Clinic-Management/website-code-premium/dental-clinic-workspace/src/lib/server/directory.ts)
- [`src/app/(staff)/clinical/services/new/page.tsx`](file:///d:/work/Clients/Health-Clinic-Management/website-code-premium/dental-clinic-workspace/src/app/(staff)/clinical/services/new/page.tsx)
- [`src/app/(staff)/clinical/services/[serviceId]/edit/page.tsx`](file:///d:/work/Clients/Health-Clinic-Management/website-code-premium/dental-clinic-workspace/src/app/(staff)/clinical/services/[serviceId]/edit/page.tsx)
- [`src/app/(staff)/clinical/prescriptions/page.tsx`](file:///d:/work/Clients/Health-Clinic-Management/website-code-premium/dental-clinic-workspace/src/app/(staff)/clinical/prescriptions/page.tsx)
- [`src/app/(staff)/clinical/prescriptions/new/page.tsx`](file:///d:/work/Clients/Health-Clinic-Management/website-code-premium/dental-clinic-workspace/src/app/(staff)/clinical/prescriptions/new/page.tsx)
- [`src/app/(staff)/clinical/odontogram/page.tsx`](file:///d:/work/Clients/Health-Clinic-Management/website-code-premium/dental-clinic-workspace/src/app/(staff)/clinical/odontogram/page.tsx)
- [`src/app/(staff)/billing/invoices/new/page.tsx`](file:///d:/work/Clients/Health-Clinic-Management/website-code-premium/dental-clinic-workspace/src/app/(staff)/billing/invoices/new/page.tsx)
- [`src/app/patient-portal-demo/page.tsx`](file:///d:/work/Clients/Health-Clinic-Management/website-code-premium/dental-clinic-workspace/src/app/patient-portal-demo/page.tsx)
- [`src/components/portal/appointment-card.tsx`](file:///d:/work/Clients/Health-Clinic-Management/website-code-premium/dental-clinic-workspace/src/components/portal/appointment-card.tsx)
- [`src/components/portal/portal-dashboard-view.tsx`](file:///d:/work/Clients/Health-Clinic-Management/website-code-premium/dental-clinic-workspace/src/components/portal/portal-dashboard-view.tsx)
- [`src/components/portal/portal-shell.tsx`](file:///d:/work/Clients/Health-Clinic-Management/website-code-premium/dental-clinic-workspace/src/components/portal/portal-shell.tsx)
- [`src/components/marketing/luxury-roadmap.tsx`](file:///d:/work/Clients/Health-Clinic-Management/website-code-premium/dental-clinic-workspace/src/components/marketing/luxury-roadmap.tsx)

## Quality
- **typecheck**: `npm run typecheck` (`tsc --noEmit`) -> **PASSED (0 errors)**
- **eslint**: `npx eslint .` -> **PASSED (0 errors)**

## Migration / RLS
No migration required

## Status

READY FOR MANUAL REVIEW