---
name: clinic-workflow
description: Implements and verifies the existing dental clinic application's doctor availability, doctor services, appointment scheduling, patient booking, consultation, dental chart, prescription, longitudinal history, reports and follow-up workflow. Use whenever modifying doctor/patient dashboards, schedules, appointments, clinical encounters, prescriptions, dental chart, follow-up, Supabase schema/RLS, or related tests.
---

# Dental Clinic Workflow Skill

## Mission
Treat this product as one connected clinical lifecycle, not a set of unrelated pages:

Doctor configuration → Scheduling engine → Patient booking → Doctor operational queue → Clinical encounter → Permanent patient history → Follow-up → Next encounter.

Before changing code, inspect the current implementation and preserve good existing work.

## Mandatory execution order
1. Audit routes, auth, roles, schema, RLS, API/server actions, scheduling, patient records, prescriptions, dental chart and follow-up.
2. Identify the canonical source of truth for appointments, doctors, patients, services and encounters.
3. Write a short implementation plan naming affected files/tables and compatibility risks.
4. Fix domain/data model before polishing UI when the model is the root problem.
5. Centralize scheduling/business logic; do not duplicate it across components.
6. Implement patient and doctor flows against real data.
7. Verify authorization and concurrency server-side.
8. Use the built-in browser sub-agent to test the complete workflow.
9. Report migrations/manual steps separately.

## Doctor service model
A doctor does not necessarily perform every service. Maintain a Doctor ↔ Service relationship with doctor-specific estimated duration.

Expected behavior:
- Doctor can enable/disable supported services.
- Doctor can set/edit duration per service.
- Existing appointments retain their booked duration snapshot even if the doctor changes duration later.

## Availability model
The doctor configures availability for the next 10 calendar days.

Requirements:
- zero, one, or many intervals per day;
- e.g. 09:00–12:00 and 14:00–18:00 on the same date;
- doctor can only edit their own availability;
- do not silently invalidate existing booked appointments when availability is edited.

If removing an interval would conflict with an active appointment, block the edit or require explicit rescheduling/cancellation.

## Slot engine
Generate availability dynamically. Do not require the doctor to manually pre-create every slot.

A candidate appointment is valid only when:
- selected doctor provides selected service;
- service duration for that doctor is known;
- start is not in the past;
- [start, end) fits fully inside one availability interval;
- it overlaps no active appointment/block;
- backend validates the same rules at booking time.

Use one canonical scheduling function/service. UI may consume it but must not independently reimplement business logic.

## Concurrency rule
Two patients must never successfully reserve the same overlapping time.

Use the strongest mechanism appropriate to the current Postgres/Supabase design: transaction-safe function, exclusion/unique strategy where applicable, advisory/row locking, or atomic server-side validation. Do not rely on a frontend pre-check.

On race failure return a friendly conflict and refresh available slots.

## Patient booking flow
1. Select service.
2. Show only doctors who provide it.
3. Select doctor.
4. Calculate real availability for the next relevant dates.
5. Group valid starts by date.
6. Confirm appointment summary.
7. Persist appointment with duration/start/end/service snapshot.
8. Show upcoming appointment on patient dashboard.

## Doctor dashboard
Operational hierarchy:
1. Next Patient prominently.
2. Today's schedule chronologically.
3. Clear states: upcoming, checked in, in consultation, completed, cancelled/no-show where supported.
4. Opening the patient/appointment should lead directly into the consultation flow.

## Consultation encounter
A consultation is a first-class encounter, normally linked to appointment + doctor + patient.

The consultation workspace should make available:
- patient summary;
- relevant previous encounters;
- dental chart history;
- diagnosis/clinical notes;
- actual procedures performed;
- prescription;
- reports/attachments;
- follow-up recommendation.

Avoid forcing the doctor through many disconnected pages during one visit.

## Dental chart
Reuse the existing chart if present.

Each finding/procedure should retain encounter context:
patient, doctor, encounter, tooth, finding/condition, procedure/treatment and timestamp.

Do not destroy dental history by storing only a mutable current tooth status. A derived current state is fine, but historical entries must remain queryable.

## Booked service vs performed treatment
Never overwrite the appointment's originally booked service to represent clinical outcome.

Example:
- booked: General Consultation
- diagnosis: caries
- actual procedure: Filling

Or:
- booked: Root Canal
- actual procedure: Root Canal Stage 1

Preserve both.

## Prescription and reports
Prescription belongs to the encounter and patient/doctor. Preserve items, instructions and timestamps.

Reports/X-rays/photos/PDFs should be linked to patient + encounter when possible. Reuse the project's existing storage provider/bucket architecture.

## Completing a consultation
Completion should:
- mark encounter completed;
- transition appointment appropriately;
- persist all clinical records;
- make the encounter part of immutable historical timeline;
- allow dashboard to advance to next patient.

Never delete completed history.

## Follow-up
Doctor can record:
- required yes/no;
- recommended date;
- reason/notes.

Patient sees the recommendation and can book a follow-up using real availability. Recommended date never bypasses scheduling constraints.

Follow-up appointment should reference the originating encounter/recommendation where architecture permits.

At follow-up:
- show relevant prior visit context;
- create a NEW encounter;
- never edit the old encounter to represent the new visit.

## Patient history
Patient dashboard should expose authorized patient-facing information:
- upcoming appointment;
- previous visits/doctors;
- treatment/procedure summary;
- prescriptions;
- reports intended for patient visibility;
- follow-up recommendation.

Doctor-internal notes should not automatically become patient-visible.

## Doctor patient directory
Default to most recently seen first. Search by:
- patient name;
- phone;
- stable human-readable Patient ID.

Use database/server search and pagination for scale.

## Security checklist
Always test:
- doctor cannot read/edit another doctor's private schedule through direct requests;
- patient cannot read another patient's record by changing an ID;
- clinical write actions require authorized doctor/encounter relationship;
- RLS/server checks match UI assumptions.

## Browser verification scenarios
Use Antigravity built-in browser tools to verify at least:
1. Doctor creates two availability intervals on one date.
2. Doctor enables a service with a duration.
3. Patient selects that service and only eligible doctors appear.
4. Valid slots fit duration and existing bookings.
5. Patient books one slot.
6. Doctor dashboard shows that patient in correct chronological position.
7. Doctor starts consultation, records dental finding + diagnosis + procedure + prescription.
8. Doctor completes consultation and sets follow-up.
9. Patient sees visit history/prescription/follow-up.
10. Follow-up booking creates a new future appointment and later a new encounter.

Also inspect console/network errors during the flow.

## Supabase workflow
Use Supabase MCP read-only first to inspect:
- tables/columns;
- migrations;
- RLS;
- indexes;
- advisors/logs;
- generated TypeScript types where useful.

If schema changes are needed, produce migration files in the repo. Unless explicitly authorized, do not apply destructive or production migrations through MCP.

## Final report
When implementation is done, report:
- what was wrong;
- what changed;
- schema/migration/RLS/index changes;
- key files changed;
- scheduling/conflict strategy;
- clinical encounter/history strategy;
- follow-up linkage;
- browser tests run and results;
- exact manual migration/environment steps still required.
