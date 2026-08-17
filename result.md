# Phase 5L.4 — Add Linked Follow-Up Indicator to Scheduler Report

---

### A. Files Changed

1. [`src/lib/server/directory.ts`](file:///d:/work/Clients/Health-Clinic-Management/website-code-premium/dental-clinic-workspace/src/lib/server/directory.ts)
   - Added `originating_encounter_id` to the `appointments` select query in `listAppointmentsForDay(practitionerId, date)`.
2. [`src/components/staff/daily-schedule-board.tsx`](file:///d:/work/Clients/Health-Clinic-Management/website-code-premium/dental-clinic-workspace/src/components/staff/daily-schedule-board.tsx)
   - Added `originating_encounter_id?: string | null` to the `Appointment` interface.
   - Rendered an inline subtle `"Follow-up"` badge beside the patient name in the visual timeline slots.
3. [`src/components/staff/appointment-list.tsx`](file:///d:/work/Clients/Health-Clinic-Management/website-code-premium/dental-clinic-workspace/src/components/staff/appointment-list.tsx)
   - Added `originating_encounter_id?: string | null` to the `Appointment` interface.
   - Rendered a subtle `"Follow-up"` badge alongside the existing status badge.

---

### B. Scheduler Loader / Type Before Change

* **Loader**: `listAppointmentsForDay` previously selected:
  `"id, starts_at, ends_at, status, notes, patients:patient_id(...), services:service_id(...)"`
* **Appointment Types**: `Appointment` interface in `daily-schedule-board.tsx` and `appointment-list.tsx` did not include `originating_encounter_id`.

---

### C. How `originating_encounter_id` is Loaded

* Selected directly as an optional scalar column from `appointments` (`originating_encounter_id`).
* No join against `clinical_encounters`, no loading of diagnosis, performed treatment, clinical notes, or follow-up reason.

---

### D. Exact Follow-Up Detection Rule

```typescript
const isFollowUp = appointment.originating_encounter_id != null;
```

---

### E. Badge Placement

* **`DailyScheduleBoard`**: Rendered inline directly next to the patient's full name in each timeline card:
  `<span className="shrink-0 rounded bg-primary-soft px-1.5 py-0.5 text-[9px] font-bold text-primary">Follow-up</span>`
* **`AppointmentList`**: Rendered in the status action cluster adjacent to the status badge:
  `<Badge variant="outline" className="border-primary/25 bg-primary-soft text-primary font-medium text-[11px]">Follow-up</Badge>`

---

### F. Desktop / Mobile Coverage

* **Desktop Timeline View**: Displayed in `DailyScheduleBoard` time slot cards.
* **Mobile / Responsive List View**: Displayed in `AppointmentList` list items.

---

### G. Status + Follow-Up Presentation

* The appointment's actual canonical status remains completely separate and unchanged:
  - `Confirmed` + `Follow-up`
  - `Checked In` + `Follow-up`
  - `Completed` + `Follow-up`
  - `Cancelled` + `Follow-up`
  - `No Show` + `Follow-up`

---

### H. Rebooked / Cancelled / No-Show Behavior

* Cancelled and no-show follow-up appointments retain `originating_encounter_id` in the database and display the `Follow-up` badge.
* Follow-up appointments rebooked via Phase 5J (`link_follow_up_originating_encounter` RPC 0031) inherit `originating_encounter_id` and automatically display the `Follow-up` badge.

---

### I. Receptionist & Privacy Behavior

* **Receptionist Access**: Receptionists viewing the Scheduler see the operational `Follow-up` indicator as standard appointment metadata.
* **No Confidential Leak**: No clinical notes, private notes, diagnosis, or encounter contents are queried or displayed.

---

### J. Dashboard Impact

* Staff Dashboard (`/dashboard`) maintains its separate dedicated summary queries and was intentionally not modified in this phase.

---

### K. Confirmation No Appointment / Business Logic Changed

* **Confirmed**: No booking, rescheduling, status transition, or RPC logic was altered. Only visual presentation in Scheduler was enhanced.

---

### L. Quality Check Results

* **`npm run typecheck`**: `EXIT 0` (0 errors)
* **`npx eslint .`**: `EXIT 0` (0 warnings, 0 errors)
* **`npm run build`**: `EXIT 0` (Production build succeeded with 35 static/dynamic routes)