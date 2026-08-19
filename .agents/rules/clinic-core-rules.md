# Dental Clinic Project Core Rules

These rules are mandatory for all work in this repository.

## Existing-project rule
- This is an existing application. Audit before modifying.
- Reuse working auth, routes, components, schema, services and design system.
- Never create a parallel appointment/patient/prescription system unless the existing model is provably unusable.
- Never leave production flow dependent on mock/static data.

## Database safety
- Default to read-only Supabase MCP for audit and inspection.
- Do not execute destructive SQL, DROP, mass DELETE, reset, truncate, or production data mutations.
- If a migration is required, create a migration SQL file in the repository and explain exactly how to apply it manually.
- Preserve existing data. Migrations must be backward-aware.
- Review RLS, constraints and indexes whenever schema changes affect authorization or scheduling.

## Scheduling invariants
- Doctor availability supports multiple intervals per day.
- Doctor availability is doctor-specific.
- Doctor services are doctor-specific.
- Appointment duration comes from Doctor + Service configuration at booking time and must be snapshotted on the appointment.
- A slot is valid only if the entire appointment fits inside one availability interval.
- Never allow overlap with another active appointment.
- Never allow past-time booking.
- Cancelled appointments should not block time unless business rules explicitly require it.
- Booking conflicts must be prevented server/database side, not only in the UI.

## Clinical invariants
- Booked service and actual performed procedure are different concepts.
- Every visit/follow-up creates a new clinical encounter.
- Never overwrite completed historical encounters to represent a later visit.
- Dental findings must preserve longitudinal history.
- Prescription, reports, diagnosis, procedures and follow-up must be linked to the encounter.
- Follow-up must reference the original encounter/recommendation where possible.

## Authorization
- Doctor sees/manages only their own schedule and appointments unless an explicit admin permission exists.
- Patient sees only their own records.
- Backend/RLS must enforce access; hidden buttons are not security.

## Verification & Result Documentation
- After meaningful UI changes, use Antigravity's built-in browser sub-agent to run the actual flow.
- Verify console errors, failed network requests, loading states and responsive layout.
- Never declare the task complete only because code compiles.
- **MANDATORY**: Always write the comprehensive technical report, root-cause diagnosis, code/schema diffs, and verification summary directly into `result.md` at the end of every task/problem automatically.
