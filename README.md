# Clinic Care — Premium Dental Clinic Workspace

A production-oriented dental clinic management system built with Next.js 16, TypeScript, Tailwind CSS, and Supabase. The Basic launch scope includes all nine core modules in one role-aware workspace.

## Included modules

1. Complete clinic website
2. Central patient profiles with unique `PT-XXXXXXXX` patient references
3. Role-scoped clinical scheduler and practitioner availability
4. Patient online booking
5. Digital patient registration and medical history
6. Itemised invoicing, payments, due dates, and balances
7. Prescription documentation with clinical safety context
8. Interactive 3D-style FDI odontogram and treatment planning
9. Appointment confirmations and reminder queue

## Premium workspace highlights

- Command-centre dashboard with today’s patient flow and seven-day activity chart
- Patient search by name, phone number, or patient ID
- Longitudinal patient timeline: complaint, outcome, completion state, and follow-up
- Dentist privacy: a dentist sees only their own diary and manages only their availability
- All time outside an enabled availability window is unavailable by default
- Professional invoice register with paid, outstanding, overdue, and itemised totals
- Prescription register with allergies, current medication, conditions, and prescribing notes
- Event-sourced odontogram history with condition, recommended treatment, priority, date, and fee
- Responsive light/dark admin experience with role-aware navigation
- Premium patient portal with care dashboard, health alerts, appointment history, self-rescheduling, profile editing, treatment chart, medication records, and billing summaries

## Quick start

Requirements: Node.js 22.13 or newer and a Supabase project.

```bash
cp .env.local.example .env.local
# Add your Supabase URL and keys to .env.local
bash scripts/setup-local.sh
npm run dev
```

Open `http://localhost:3000`. A database-free visual showcase is available at `http://localhost:3000/workspace-demo`.

For full database setup, see [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md).

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

The secret key is server-only. Never prefix it with `NEXT_PUBLIC_` or expose it in browser code.

## Common commands

```bash
npm run dev             # Next.js development server
npm run build           # Production Next.js build
npm run start           # Start the production build
npm run typecheck       # TypeScript validation
npm run lint            # ESLint validation
```

## Database changes in this delivery

- `0018_doctor_owned_scheduler.sql` — enforces doctor-owned schedules, availability, and appointments with RLS
- `0019_odontogram_treatment_planning.sql` — adds condition, treatment recommendation, priority, planned date, and estimated fee to chart history
- `0020_patient_self_reschedule.sql` — adds identity-derived, availability-validated patient appointment rescheduling

Apply migrations with `npx supabase db push` after linking the intended Supabase project.

## Important clinical note

This system supports documentation and workflow; it does not replace a clinician’s judgement or local prescribing, consent, tax, retention, privacy, and record-keeping requirements. Configure wording, taxes, currency, medicine lists, and retention rules for the clinic’s jurisdiction before production use.
