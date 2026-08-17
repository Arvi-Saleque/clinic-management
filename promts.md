# TASK: Audit and Rebuild the Core Doctor–Patient Appointment & Clinical Workflow

You are working on an **already existing Dental Clinic Management System**.

The project already contains several implemented modules, UI screens, database structures, authentication, doctor/patient dashboards, appointments, prescriptions, dental chart features, etc.

However, the current implementation is **not properly connected as one coherent workflow**. Some screens or features may already exist but:

* the workflow is incorrect,
* data may not be connected correctly,
* appointment scheduling may be unrealistic,
* doctor availability may not work correctly,
* patient appointment flow may be incomplete,
* doctor consultation workflow may be fragmented,
* previous patient records may not be properly preserved,
* follow-up workflow may not be correctly linked,
* dashboards may display static/demo/incorrect data,
* or duplicate/parallel implementations may exist.

Your job is **NOT to blindly rebuild the entire application from scratch.**

Your job is to:

1. Inspect the entire existing codebase.
2. Understand the existing architecture, database, routes, components and authentication.
3. Identify what is already correctly implemented.
4. Reuse good existing code.
5. Refactor or replace incorrect implementations where necessary.
6. Connect all modules into the exact workflow defined below.
7. Keep the existing visual design/theme wherever it is already professional.
8. Do not unnecessarily break other working modules.
9. Make the resulting workflow production-quality and data-driven.

---

# 1. FIRST: AUDIT THE EXISTING PROJECT

Before implementing anything, inspect:

* application routes,
* Doctor portal,
* Patient portal,
* Dashboard modules,
* Appointment system,
* Schedule/Availability system,
* Services/Treatments,
* Patient records,
* Prescription module,
* Dental chart,
* Reports/documents,
* Follow-up system,
* database schema,
* Supabase/database integration,
* authentication,
* authorization / role handling,
* reusable components,
* existing API/server actions/services,
* existing migrations.

Determine:

### What already exists?

### What works?

### What is partially implemented?

### What is incorrect?

### What is disconnected?

### What can be reused?

Do not create duplicate modules when an existing module can be properly improved.

---

# 2. CORE SYSTEM PRINCIPLE

The application must operate as one connected lifecycle:

**Doctor Availability + Services**

→ **Appointment Slot Calculation**

→ **Patient Booking**

→ **Doctor Dashboard**

→ **Patient Check-In / Consultation**

→ **Dental Chart + Diagnosis + Treatment + Prescription**

→ **Complete Consultation**

→ **Follow-up**

→ **Permanent Patient Clinical History**

→ **Future Appointment / Follow-up Consultation**

Every part must use real database data.

No fake/static/demo values should remain in production flows.

---

# 3. DOCTOR ONBOARDING / SCHEDULE CONFIGURATION

After login, a doctor must be able to configure two major things:

## A. Doctor Services / Treatments

Every dentist does NOT necessarily provide every dental service.

Therefore each doctor must have their own supported service list.

Example:

* General Consultation
* Scaling
* Filling
* Tooth Extraction
* Root Canal
* Crown
* Whitening
* Implant Consultation
* Orthodontic Consultation

The doctor must be able to select/configure which services they personally perform.

Each doctor-service relationship must also contain an estimated duration.

Example:

| Service    | Doctor   | Duration   |
| ---------- | -------- | ---------- |
| Scaling    | Doctor A | 45 minutes |
| Root Canal | Doctor A | 60 minutes |
| Extraction | Doctor A | 30 minutes |
| Scaling    | Doctor B | 30 minutes |

Important:

The duration belongs to the **Doctor + Service combination**, because different doctors may require different amounts of time for the same service.

Do NOT assume one globally fixed duration if the existing architecture can support doctor-specific durations.

Doctor should be able to:

* add/select supported service,
* set duration,
* edit duration,
* disable/remove a service.

Previously completed appointments must NOT become invalid if a doctor later changes service duration.

---

# 4. DOCTOR AVAILABILITY — NEXT 10 DAYS

The doctor must define their availability for the **next 10 calendar days**.

A doctor may have:

* no availability on a day,
* one availability interval,
* multiple availability intervals on the same day.

Example:

### August 16

10:00 AM – 1:00 PM
4:00 PM – 7:00 PM

### August 17

11:00 AM – 2:00 PM

### August 18

Not Available

The UI should make this extremely easy to understand.

Prefer a professional schedule/calendar-based experience rather than a basic ugly form.

The doctor should clearly see:

* Date
* Day
* Available intervals
* Unavailable time
* Existing appointments

The doctor must only manage **their own schedule**.

A normal doctor must NEVER see or edit another doctor's schedule unless the existing system has a separate authorized admin role that explicitly needs it.

---

# 5. MULTIPLE TIME SEGMENTS

Availability must support multiple time segments per day.

Example:

```text
09:00 – 12:00
14:00 – 17:00
19:00 – 21:00
```

Do NOT create a simplistic model with only:

```text
start_time
end_time
```

per doctor/day if it prevents multiple intervals.

Model the data properly.

---

# 6. APPOINTMENT SLOT ENGINE

This is one of the most important parts of the application.

Doctors should NOT manually create every possible appointment slot.

The system must dynamically calculate appointment availability using:

* doctor's availability intervals,
* selected treatment/service,
* treatment duration for that doctor,
* already booked appointments,
* blocked/unavailable periods if supported,
* current time,
* appointment status.

---

# 7. SLOT CALCULATION EXAMPLE

Suppose:

Doctor availability:

```text
10:00 AM – 1:00 PM
```

Selected service duration:

```text
45 minutes
```

Existing confirmed appointment:

```text
10:00 AM – 10:40 AM
```

The system must calculate which starting times can actually fit a full 45-minute appointment inside the remaining availability.

Never allow an appointment that:

* overlaps another active appointment,
* starts outside doctor availability,
* ends outside doctor availability,
* crosses between separate availability intervals,
* starts in the past,
* ignores the selected treatment duration.

The backend must always validate this again when booking.

Do NOT rely only on frontend disabled buttons.

---

# 8. CONCURRENCY / DOUBLE BOOKING

The system must protect against this scenario:

Patient A and Patient B both see 3:00 PM available.

Both click confirm almost simultaneously.

Only ONE booking should succeed.

The second booking must fail gracefully and return something like:

> This time is no longer available. Please choose another slot.

Use database constraints, transactions, server-side validation, locking, or the most appropriate mechanism supported by the project's current stack.

Never allow double booking.

---

# 9. PATIENT APPOINTMENT BOOKING FLOW

Patient appointment booking flow should be:

### STEP 1 — Select Treatment / Service

Patient selects what they want.

Example:

> Scaling

---

### STEP 2 — Select Doctor

Only show doctors who actually provide that service.

Do not show irrelevant doctors.

Doctor card can show useful information already available in the database, such as:

* Name
* Specialty
* Qualification
* Profile photo
* Service duration
* Next available time

Do not invent data that is not part of the application.

---

### STEP 3 — Show Available Appointment Times

After selecting a doctor, calculate availability.

Group slots by date.

Example:

### Today

* 4:00 PM
* 5:30 PM

### Tomorrow

* 10:00 AM
* 11:30 AM
* 4:30 PM

### August 18

* 9:30 AM
* 12:00 PM

Only valid appointment times must appear.

---

### STEP 4 — Confirm Appointment

Show a clear summary:

* Doctor
* Service
* Date
* Start time
* Estimated duration

Patient confirms.

Then create appointment.

---

# 10. APPOINTMENT RECORD MUST SNAPSHOT IMPORTANT INFORMATION

Do not rely entirely on mutable future service settings.

Appointment should preserve enough information to understand what was originally booked.

At minimum consider storing:

* patient_id
* doctor_id
* service_id
* booked service name/reference
* scheduled start
* scheduled end
* estimated duration at booking time
* appointment type
* status
* created_at

If existing schema already solves this differently, keep the architecture consistent.

---

# 11. APPOINTMENT STATUSES

Create/use a sensible status lifecycle.

For example:

```text
booked
confirmed
checked_in
in_consultation
completed
cancelled
no_show
```

Do not over-engineer statuses if existing architecture already has a suitable equivalent.

However, status transitions must be logical.

Example:

```text
booked
↓
checked_in
↓
in_consultation
↓
completed
```

Cancelled appointments must no longer block availability if business rules allow the slot to be reused.

Completed appointments must remain permanently in history.

---

# 12. PATIENT DASHBOARD — BEFORE CONSULTATION

Patient dashboard should clearly show:

## Upcoming Appointment

Example:

**Scaling**
Dr. Rahman
August 16, 2026
5:15 PM

Actions may include, according to existing requirements:

* View Details
* Cancel appointment
* Reschedule appointment

Do NOT add unnecessary features if the application currently does not require them.

---

# 13. DOCTOR DASHBOARD

Doctor dashboard must focus heavily on operational usefulness.

The first thing a doctor should understand after login is:

> Who is my next patient?

Create a prominent **Next Patient** card.

Example:

**Next Patient**

Salek Bin Hossain
Patient ID: PAT-00231
Treatment: Scaling
Appointment: 5:15 PM
Status: Waiting

Relevant action:

**Open Patient / Start Consultation**

---

# 14. TODAY'S SCHEDULE

Below Next Patient, show today's appointments in chronological order.

Example:

```text
10:00  Patient A  Completed
11:00  Patient B  Completed
12:30  Patient C  Checked In
02:00  Patient D  Next
03:00  Patient E  Upcoming
```

This should update based on actual appointment states.

Highlight clearly:

* Completed
* Current/Checked In
* Next
* Upcoming
* Cancelled
* No-show where relevant

Doctor must only see their own appointments.

---

# 15. CHECK-IN / START CONSULTATION

When the patient arrives and the doctor selects the appointment/patient, the doctor should be able to start the clinical session.

Depending on current implementation, this can be:

**Check In**

followed by:

**Start Consultation**

or a simplified combined action.

Keep the UX professional and avoid unnecessary clicks.

Once consultation begins, open the **Consultation Workspace**.

---

# 16. CONSULTATION WORKSPACE

This should be the primary clinical working screen for the doctor.

The doctor should not need to navigate across many unrelated pages while treating the patient.

The screen should provide enough context and tools in one coherent workflow.

---

# 17. PATIENT SUMMARY DURING CONSULTATION

Clearly show:

* Patient Name
* Unique Patient ID
* Age / DOB if available
* Gender if already part of system
* Phone/contact
* Relevant medical notes
* Allergies if supported
* Last visit date
* Previous doctor
* Previous treatments
* Follow-up context if this is a follow-up visit

Do not expose unrelated sensitive information unnecessarily.

---

# 18. PREVIOUS CLINICAL HISTORY

Doctor must be able to inspect the patient's past visits.

Each previous consultation should remain a separate historical record.

Example:

```text
Visit — Aug 02, 2026
Doctor: Dr. Rahman
Service: Consultation
Diagnosis: ...
Treatment: ...
Prescription: ...
Dental Findings: ...
Reports: ...
```

IMPORTANT:

**Never overwrite previous consultation records when a patient returns.**

Every new visit must create a new clinical encounter/consultation.

---

# 19. DENTAL CHART

The system already may contain a dental chart.

Audit it.

Reuse/improve it rather than creating a duplicate implementation.

Doctor should be able to select a specific tooth and record clinical findings.

For example:

```text
Tooth #16
Condition: Caries
Treatment: Filling
```

or:

```text
Tooth #26
Finding: Infection
Planned Treatment: Root Canal
```

Each dental chart entry should be associated with:

* patient,
* encounter/consultation,
* doctor,
* tooth,
* finding/condition,
* treatment/procedure,
* date/time.

---

# 20. DENTAL HISTORY MUST BE LONGITUDINAL

The latest dental chart state is useful, but historical information must not disappear.

Example:

```text
Tooth #16

Aug 01
Caries identified

Aug 05
Filling completed

Dec 10
Follow-up review
```

Do not simply overwrite:

```text
tooth.status = "healthy"
```

and destroy previous history.

Maintain encounter history while optionally deriving a current tooth state.

---

# 21. DIAGNOSIS

During consultation doctor should be able to enter:

* Diagnosis
* Symptoms/complaints if required
* Clinical notes
* Advice
* Treatment notes

Use structured fields where useful but do not make the UI unnecessarily bureaucratic.

---

# 22. APPOINTMENT SERVICE VS ACTUAL TREATMENT

This distinction is important.

What the patient booked is not always exactly what happens clinically.

Example:

Patient booked:

> General Consultation

Doctor determines:

> Root Canal required.

Or patient booked:

> Root Canal

Doctor performs only:

> Root Canal Stage 1

Therefore maintain distinction between:

### Requested/Booked Service

and

### Actual Procedure/Treatment Performed

Do not overwrite the original appointment service.

---

# 23. PRESCRIPTION

Doctor should be able to create a prescription within the consultation.

Depending on existing schema, include:

* Medicines
* Dosage
* Frequency
* Duration
* Instructions
* Clinical advice

If the application already has a good prescription builder, connect it properly to the current consultation.

Prescription must be associated with:

* patient,
* doctor,
* encounter,
* appointment where applicable,
* timestamp.

Patient must later be able to see the prescription from their visit history.

---

# 24. REPORTS / ATTACHMENTS

Doctor may upload supporting clinical files such as:

* X-ray
* Scan
* Dental photo
* Lab report
* PDF
* Other clinical attachment

Files must be associated with the patient and preferably the specific encounter.

The next doctor visit should be able to see relevant previous reports.

Use the project's existing storage mechanism.

Do not introduce a new storage provider unless required.

---

# 25. COMPLETE CONSULTATION

Once doctor finishes:

* diagnosis,
* treatment,
* dental chart,
* prescription,
* reports,
* notes,

they should click:

**Complete Consultation**

Before completion, validate required information according to existing business rules.

On completion:

* appointment becomes completed,
* consultation/encounter becomes completed,
* clinical record becomes part of permanent patient history,
* completed appointment remains visible historically,
* dashboard determines the next upcoming patient.

Do not delete or overwrite records.

---

# 26. FOLLOW-UP

During or before completing consultation, doctor must be able to specify:

```text
Follow-up Required: Yes / No
```

If yes:

```text
Recommended Date
Reason / Notes
```

Example:

> Follow-up: August 25, 2026
> Reason: Root Canal Stage 2

This follow-up recommendation must appear in the patient's portal.

---

# 27. PATIENT FOLLOW-UP BOOKING

Patient dashboard should show something like:

### Follow-up Required

Dr. Rahman
Recommended: August 25
Reason: Root Canal Stage 2

Action:

**Book Follow-up**

When the patient clicks it:

* retain original doctor,
* retain follow-up context,
* optionally retain related treatment context,
* show that doctor's valid available slots,
* let patient select and confirm a new appointment.

The recommended date should NOT bypass availability rules.

The patient must still choose an actually available time.

---

# 28. FOLLOW-UP APPOINTMENT RELATIONSHIP

A follow-up appointment should ideally reference the original visit/follow-up recommendation.

This makes it possible to understand:

```text
Original Consultation
     ↓
Follow-up Recommendation
     ↓
Follow-up Appointment
     ↓
Follow-up Consultation
```

Avoid relying only on plain-text notes to infer these relationships.

---

# 29. FOLLOW-UP CONSULTATION

When the same patient returns, the doctor's consultation workspace should immediately show the relevant previous clinical context.

For example:

### Previous Visit

August 16, 2026

* Diagnosis
* Dental chart findings
* Procedure performed
* Prescription
* Doctor notes
* Uploaded X-ray
* Follow-up reason

Then provide a new section:

### Current Consultation

The doctor enters today's new findings independently.

Never edit the previous consultation just because this is a follow-up.

---

# 30. DOCTOR → PATIENTS SECTION

Doctor must have a dedicated Patients section.

This is NOT the same as appointments.

It should provide quick access to patients previously treated by the doctor, according to business/privacy rules.

Use a useful default ordering:

**Most recently seen patient first.**

Search must work by:

* Patient Name
* Phone Number
* Patient ID

Prefer server/database-backed search for large datasets.

Do not load an unlimited patient database into browser memory simply to filter it.

---

# 31. DOCTOR PATIENT PROFILE VIEW

When doctor opens a patient, show a professional longitudinal clinical profile.

Suggested sections:

### Patient Overview

Basic patient details.

### Clinical Summary

Recent/latest medical context.

### Visit Timeline

All relevant historical encounters.

### Appointments

Past/upcoming appointments where authorized.

### Prescriptions

Previous prescriptions.

### Treatments

Procedures performed.

### Dental Chart History

Tooth-specific historical findings.

### Reports

Uploaded documents/images.

### Follow-ups

Completed/pending follow-up recommendations.

The layout should be clinically useful and easy to scan.

---

# 32. PATIENT PORTAL — HISTORY

When patient logs in again, they should be able to see:

* Upcoming appointment
* Follow-up recommendation
* Previous visits
* Previous doctors
* Previous treatment
* Previous prescriptions

Example:

### Previous Visits

**Aug 16, 2026**
Dr. Rahman
Scaling

Clicking it opens the visit details.

---

# 33. PATIENT VISIT DETAILS

Patient-facing visit details can show:

* Doctor
* Appointment date
* Treatment/service
* Diagnosis where appropriate
* Prescription
* Instructions
* Treatment performed
* Dental information intended for patient visibility
* Patient-visible reports
* Follow-up recommendation

Doctor-only internal notes should not automatically become patient-visible unless the existing business requirement says otherwise.

Design data visibility properly.

---

# 34. UNIQUE PATIENT ID

Every patient needs a stable, human-readable unique Patient ID.

Example:

```text
PAT-000231
```

This is separate from the database UUID/internal primary key.

Doctor should be able to search using this ID.

Do not use patient name as an identifier.

---

# 35. DATA MODEL / DATABASE REVIEW

Do NOT blindly create these exact tables if equivalent structures already exist.

First inspect the current schema.

Conceptually, the system needs entities equivalent to:

```text
users
doctors
patients

services
doctor_services

doctor_availability
appointments

clinical_encounters / consultations

diagnoses
treatments / procedures

prescriptions
prescription_items

dental_chart_entries

reports / attachments

follow_up_recommendations
```

Relations should be clean and normalized enough for maintainability.

Reuse existing models where possible.

---

# 36. RECOMMENDED RELATIONSHIP MODEL

Conceptually:

```text
Doctor
 ├── DoctorServices
 ├── Availability
 └── Appointments

Patient
 ├── Appointments
 └── ClinicalEncounters

Appointment
 ├── Doctor
 ├── Patient
 ├── Service
 └── ClinicalEncounter

ClinicalEncounter
 ├── Doctor
 ├── Patient
 ├── Appointment
 ├── Diagnoses
 ├── Procedures
 ├── Prescription
 ├── DentalChartEntries
 ├── Reports
 └── FollowUpRecommendation
```

Implement according to the project's current architecture rather than copying this blindly.

---

# 37. IMPORTANT IMMUTABILITY RULE

Historical clinical information is critical.

Once a consultation is completed:

Do not casually overwrite historical:

* diagnosis,
* prescription,
* treatment,
* dental findings,
* doctor association,
* appointment information.

If legitimate correction functionality exists, use explicit edit/audit behavior.

Never make past medical history depend entirely on mutable current settings.

---

# 38. AUTHORIZATION / SECURITY

Enforce authorization on the backend/server/database layer.

Do not merely hide buttons.

### Doctor

Doctor can:

* manage own availability,
* manage own services,
* see own appointments,
* access patients they are permitted to treat,
* create/edit current clinical encounter,
* view relevant clinical history.

Doctor cannot:

* edit another doctor's schedule,
* access unauthorized data,
* modify arbitrary historical records.

### Patient

Patient can:

* see own data,
* book own appointment,
* see own appointments,
* see permitted clinical history,
* see own prescriptions,
* book follow-ups.

Patient cannot:

* access another patient's record,
* modify doctor clinical notes,
* create fake completed clinical records.

### Admin

Keep existing admin permissions if already implemented.

Do not accidentally weaken authorization during refactoring.

---

# 39. SERVER-SIDE VALIDATION

Critical rules must be enforced server-side.

Examples:

* valid doctor,
* doctor provides selected service,
* availability exists,
* requested appointment fits availability,
* duration is correct,
* no overlap,
* appointment is not in past,
* patient owns patient-side action,
* doctor owns doctor-side operation,
* consultation corresponds to appointment,
* completed appointment cannot accidentally restart.

Frontend validation alone is not enough.

---

# 40. TIME / DATE HANDLING

Scheduling bugs are dangerous.

Audit the project's timezone handling.

The clinic operates in its configured local timezone.

Ensure:

* database timestamps are handled consistently,
* appointment display is correct,
* date boundaries work,
* next 10 days calculation works,
* appointments do not shift unexpectedly because of UTC conversion,
* DST-safe patterns are used if the system may operate internationally.

Do not store ambiguous date/time values carelessly.

---

# 41. RESCHEDULING / CANCELLATION

If existing system supports these features, make them compatible with the new scheduling engine.

When an active appointment is cancelled:

* its reserved time should become available again if appropriate.

When rescheduling:

* validate the new slot,
* avoid temporarily creating conflicting appointments,
* retain useful appointment history/audit information where possible.

Do not break existing appointment history.

---

# 42. DOCTOR AVAILABILITY EDITING WITH EXISTING APPOINTMENTS

Important edge case:

Doctor sets:

```text
10:00–5:00
```

Patients book appointments.

Later doctor changes availability to:

```text
10:00–1:00
```

But there is already a booked appointment at 3:00.

Do NOT silently delete or corrupt the appointment.

Handle this safely.

Possible behavior:

* prevent removing availability that contains active appointments,
* warn doctor,
* require appointments to be rescheduled/cancelled first.

Choose the best approach for the current application.

---

# 43. UI/UX REQUIREMENTS

The system should feel like a professional healthcare SaaS product.

Do not create oversized cards everywhere.

Prioritize:

* information hierarchy,
* schedule readability,
* operational speed,
* clinical usability,
* clear status,
* meaningful empty states,
* responsive layout,
* clean typography,
* consistent spacing.

Use the existing design system/components when they are good.

Avoid redesigning unrelated screens unnecessarily.

---

# 44. LOADING / ERROR / EMPTY STATES

Every important dynamic screen should handle:

### Loading

Use appropriate skeleton/loading UI.

### Empty State

Example:

> No appointments scheduled today.

### Error

Example:

> Unable to load appointments. Try again.

### Scheduling Conflict

Example:

> This time was just booked by another patient. Please select another available time.

Do not leave blank screens.

---

# 45. PERFORMANCE

Avoid unnecessary repeated database calls.

Use:

* appropriate indexes,
* server-side filtering,
* pagination,
* efficient date-range queries,
* reusable services/hooks,
* caching only where safe.

Potential indexes should include fields frequently queried together, such as:

```text
appointments.doctor_id
appointments.patient_id
appointments.start_time
appointments.status

availability.doctor_id
availability.date

clinical_encounters.patient_id
clinical_encounters.doctor_id
```

Use the project's database capabilities appropriately.

---

# 46. DO NOT CREATE TWO SOURCES OF TRUTH

If existing code has:

```text
appointments
```

and another unfinished implementation introduces:

```text
bookings
```

do not keep both unless they represent genuinely different concepts.

Identify the canonical source of truth.

The same applies to:

* patient profiles,
* prescriptions,
* schedules,
* services,
* consultation records.

Clean duplicate architecture where safe.

---

# 47. MIGRATIONS

If database changes are required:

Create proper migration files.

Do NOT assume migrations have already been applied.

Provide the exact SQL/migration required.

Do not destroy existing production data.

Migration must be designed with existing records in mind.

If this project uses Supabase:

* inspect existing Supabase schema/migrations,
* update/create migrations,
* update types if generated types are used,
* review RLS policies,
* ensure indexes and constraints are correct.

If automatic migration execution is not possible in the environment, prepare the exact migration file so it can be manually copied/applied.

---

# 48. RLS / DATABASE SECURITY

If Supabase Row Level Security is being used, review it carefully.

Examples:

Doctor should not be able to query every doctor's private schedule simply because frontend filters it.

Patient should not be able to request another patient's UUID and receive their data.

Policies must match the actual role relationships.

Do not disable RLS simply to make development easier.

---

# 49. EXPECTED DOCTOR FLOW

The final doctor flow should feel like this:

```text
LOGIN
  ↓
Dashboard
  ↓
See Next Patient
  ↓
See Today's Schedule
  ↓
Open Patient Appointment
  ↓
Check In / Start Consultation
  ↓
See Previous History
  ↓
Record Current Findings
  ↓
Update Dental Chart
  ↓
Record Diagnosis
  ↓
Record Actual Treatment
  ↓
Create Prescription
  ↓
Upload Reports if needed
  ↓
Specify Follow-Up
  ↓
Complete Consultation
  ↓
Return to Dashboard
  ↓
Next Patient becomes primary
```

---

# 50. EXPECTED PATIENT FLOW

```text
LOGIN
  ↓
Dashboard
  ↓
Book Appointment
  ↓
Choose Service
  ↓
Choose Doctor
  ↓
See Real Availability
  ↓
Choose Time
  ↓
Confirm
  ↓
Upcoming Appointment
  ↓
Visit Clinic
  ↓
Doctor Completes Consultation
  ↓
Visit Appears in Patient History
  ↓
Patient Can View Prescription
  ↓
Follow-Up Recommendation Appears
  ↓
Book Follow-Up
```

---

# 51. END-TO-END EXAMPLE

Use this scenario to verify the implementation.

### Doctor setup

Dr. A supports:

```text
Scaling → 45 min
Extraction → 30 min
Root Canal → 60 min
```

Availability:

```text
Aug 16
10:00–13:00
16:00–19:00
```

---

### Patient booking

Patient P selects:

```text
Scaling
```

System shows only doctors providing Scaling.

Patient selects Dr. A.

System calculates valid times using:

```text
45 minute duration
+
availability
+
existing appointments
```

Patient selects:

```text
Aug 16
11:30 AM
```

Appointment is created.

---

### Doctor workflow

Dr. A logs in.

Dashboard shows Patient P at 11:30.

At appointment time:

Dr. A opens Patient P.

Doctor starts consultation.

Doctor sees previous history.

Doctor records:

```text
Tooth #16
Caries
```

Actual treatment:

```text
Filling
```

Prescription is created.

Doctor uploads an X-ray.

Doctor sets:

```text
Follow-Up: Aug 25
```

Doctor completes consultation.

---

### Patient history

Patient logs in.

They now see:

```text
Aug 16
Dr. A
Scaling / Filling
Prescription
Dental findings
Follow-up required
```

Patient clicks:

```text
Book Follow-Up
```

System shows Dr. A's valid availability.

Patient books Aug 25.

---

### Follow-up

On Aug 25, Dr. A opens the appointment.

Doctor sees:

```text
Previous Visit
Tooth #16
Caries
Filling
Prescription
X-ray
Follow-up reason
```

Doctor creates a NEW consultation record.

Previous record remains unchanged.

This scenario must work end-to-end.

---

# 52. TEST IMPORTANT EDGE CASES

Test at minimum:

1. Doctor has no availability.
2. Doctor has multiple availability windows.
3. Doctor does not provide selected service.
4. Doctor changes service duration.
5. Patient tries to book past time.
6. Two patients attempt same slot.
7. Appointment overlaps partially.
8. Treatment duration does not fit remaining interval.
9. Appointment cancelled.
10. Appointment rescheduled.
11. Doctor tries to remove availability containing booked appointment.
12. Patient has no previous visits.
13. Patient has many previous visits.
14. Follow-up references old consultation correctly.
15. Uploaded report remains visible on later visit.
16. Doctor cannot see unauthorized doctor schedule.
17. Patient cannot see another patient's data.
18. Completed consultation remains immutable/history-safe.
19. Doctor can search Patient ID.
20. Responsive UI works on tablet/mobile/desktop.

---

# 53. AUTOMATED TESTING

Where the current project supports automated testing, add tests around the business-critical logic.

Priority tests:

* appointment overlap detection,
* slot generation,
* doctor service eligibility,
* appointment creation,
* concurrency protection,
* authorization,
* follow-up linking,
* clinical encounter persistence.

Do not spend time writing shallow tests for every decorative UI component while critical scheduling rules remain untested.

---

# 54. IMPLEMENTATION STRATEGY

Do this in a controlled sequence.

### Phase A — Audit

Understand current architecture and identify affected files/modules.

### Phase B — Data Model

Fix schema/migrations/relationships first where necessary.

### Phase C — Scheduling Engine

Implement reliable availability + service duration + booking conflict logic.

### Phase D — Patient Appointment Flow

Connect service → doctor → availability → booking.

### Phase E — Doctor Operational Dashboard

Next Patient + Today Schedule.

### Phase F — Consultation Workflow

Clinical encounter + dental chart + diagnosis + treatment + prescription + reports.

### Phase G — Follow-Up

Recommendation → booking → linked follow-up encounter.

### Phase H — Patient/Doctor History

Connect longitudinal history.

### Phase I — Authorization & Edge Cases

Review backend security and data ownership.

### Phase J — Polish & Tests

Loading/error states, responsive behavior, tests, cleanup.

Do not randomly modify dozens of unrelated files simultaneously.

---

# 55. CODE QUALITY

Follow the project's existing conventions.

Prefer:

* reusable components,
* reusable domain services,
* clean TypeScript types if TypeScript is used,
* clear naming,
* modular business logic,
* server-side validation,
* centralized appointment calculations,
* minimal duplicated logic.

The slot-calculation algorithm should NOT be independently rewritten in several components.

There should be one canonical scheduling/business-logic implementation.

---

# 56. IMPORTANT — DO NOT DESTROY EXISTING WORK

This is an existing project.

Before replacing a major implementation:

* understand why it exists,
* check all usages,
* check database dependencies,
* check routes,
* check role permissions.

Preserve:

* working authentication,
* good UI,
* useful existing components,
* existing data,
* unrelated modules.

Refactor only what is required to achieve the defined workflow.

---

# 57. REMOVE BROKEN/OBSOLETE PATHS

After the correct workflow is implemented, inspect for:

* old appointment forms,
* duplicate schedule pages,
* dead components,
* fake mock data,
* unused API endpoints,
* abandoned tables/functions,
* unreachable routes.

Safely remove obsolete code only after confirming it is no longer used.

Do not leave two competing appointment systems in the project.

---

# 58. FINAL ACCEPTANCE CRITERIA

Do not consider the task complete unless ALL of these work:

* [ ] Doctor can configure own supported treatments.
* [ ] Doctor can set individual service duration.
* [ ] Doctor can configure next 10 days availability.
* [ ] Multiple availability segments per day work.
* [ ] Patient can select treatment.
* [ ] Patient only sees doctors providing that treatment.
* [ ] Available slots are dynamically calculated.
* [ ] Existing appointments correctly block time.
* [ ] Double booking is impossible.
* [ ] Patient can successfully create appointment.
* [ ] Patient sees upcoming appointment.
* [ ] Doctor sees next patient prominently.
* [ ] Doctor sees today's appointments chronologically.
* [ ] Doctor can start consultation from appointment.
* [ ] Previous patient history appears during consultation.
* [ ] Dental chart is linked to the current encounter.
* [ ] Diagnosis can be recorded.
* [ ] Actual treatment/procedure can be recorded independently of booked service.
* [ ] Prescription is linked to encounter.
* [ ] Reports can be linked to encounter.
* [ ] Doctor can complete consultation.
* [ ] Completed consultation becomes permanent history.
* [ ] Doctor can set follow-up recommendation.
* [ ] Patient sees follow-up recommendation.
* [ ] Patient can book follow-up from doctor availability.
* [ ] Follow-up links back to previous consultation.
* [ ] Doctor sees previous consultation during follow-up.
* [ ] New follow-up creates new clinical encounter.
* [ ] Doctor can search patients by name.
* [ ] Doctor can search patients by phone.
* [ ] Doctor can search patients by Patient ID.
* [ ] Patient can see their previous doctors/visits.
* [ ] Patient can open previous prescription.
* [ ] Doctors cannot access unauthorized doctor schedules.
* [ ] Patients cannot access another patient's records.
* [ ] Existing working modules remain functional.
* [ ] UI remains responsive and professional.

---

# 59. FINAL DELIVERY EXPECTATION

After implementation, provide a concise technical summary containing:

### 1. What was wrong

Identify the important architectural/workflow issues discovered.

### 2. What was changed

Explain the main modules and business logic implemented/refactored.

### 3. Database Changes

List migrations, new relationships, indexes, policies, constraints.

### 4. Key Files Changed

List important files.

### 5. Scheduling Logic

Explain exactly how available slots and conflict validation now work.

### 6. Clinical Record Model

Explain how consultations, prescriptions, treatments, dental history and reports are persisted.

### 7. Follow-Up Logic

Explain how a completed consultation links to a future follow-up.

### 8. Security

Explain role/data access rules implemented.

### 9. Manual Steps

If any Supabase migration, SQL, environment variable, storage bucket or other manual action is required, provide exact instructions.

### 10. Verification

State which end-to-end scenarios were tested and their result.

---

# FINAL INSTRUCTION

Do not treat this as a collection of independent pages.

Treat it as **one stateful clinical workflow with a consistent domain model**.

The key architecture is:

```text
DOCTOR CONFIGURATION
        ↓
SCHEDULING ENGINE
        ↓
PATIENT APPOINTMENT
        ↓
DOCTOR OPERATIONAL QUEUE
        ↓
CLINICAL ENCOUNTER
        ↓
PATIENT LONGITUDINAL RECORD
        ↓
FOLLOW-UP
        ↓
NEXT ENCOUNTER
```

Inspect the existing system thoroughly and then implement this workflow end-to-end in the cleanest way compatible with the current codebase.
