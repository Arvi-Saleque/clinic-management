# Implementation and Run Guide

## 1. Prerequisites

- Node.js `>=22.13.0`
- npm `>=10`
- A Supabase project
- Optional: Supabase CLI access for applying migrations

## 2. Install and configure

Linux/macOS:

```bash
unzip Clinic-Care-Premium-Basic-9-Core-Modules.zip
cd dental-clinic-workspace
cp .env.local.example .env.local
```

Windows PowerShell:

```powershell
Expand-Archive .\Clinic-Care-Premium-Basic-9-Core-Modules.zip -DestinationPath .
Set-Location .\dental-clinic-workspace
Copy-Item .env.local.example .env.local
```

Fill `.env.local` with values from the Supabase project’s API settings:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=YOUR_SERVER_SECRET_KEY
```

Then run:

```bash
bash scripts/setup-local.sh
```

or on Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-local.ps1
```

## 3. Apply the Supabase schema

Use the intended development/staging project first:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

The push applies any unapplied migrations in `supabase/migrations`, including the doctor-owned scheduler RLS, enhanced odontogram treatment fields, and secure patient self-rescheduling.

Do not run `supabase db reset` against a populated production project; it recreates the local database and is intended for disposable development environments.

## 4. Run locally

```bash
npm run dev
```

- Application: `http://localhost:3000`
- Database-free UI demo: `http://localhost:3000/workspace-demo`

## 5. Production run

```bash
npm run build
npm run start
```

The default production port is 3000. Set `PORT` in the hosting environment if another port is required.

## 6. First clinic configuration

1. Create or verify the clinic organization and branch.
2. Create staff users in Supabase Auth and assign `owner_admin`, `receptionist`, or `dentist` in `profiles`.
3. Link every dentist profile to a `practitioners` row.
4. Add services, durations, and prices.
5. Ask each dentist to open Scheduler and enable their weekly availability.
6. Review invoice tax/currency wording and prescription templates for the clinic’s jurisdiction.
7. Configure the notification delivery provider if email/SMS reminders must be sent externally.
8. Verify the patient portal with a patient account: profile update, booking, rescheduling, cancellation, invoice visibility, prescriptions, and dental chart.

## 7. Access behaviour

| Role | Scheduler visibility | Key workspace access |
|---|---|---|
| Owner/admin | Clinic-wide | Full workspace and reporting |
| Receptionist | Clinic-wide scheduling | Patients, appointments, billing; clinical navigation is hidden |
| Dentist | Own diary only | Own availability, patient clinical records, prescriptions, odontogram |
| Patient | Own records only | Portal booking, appointments, invoices, prescriptions |

Database RLS is the security boundary; the interface also removes controls that a role should not use.

## 8. Verification commands

```bash
npm run typecheck
npm run lint
npm run build
```

All three passed for this delivery.

## 9. Troubleshooting

- Missing environment variable: confirm all three variables exist in `.env.local`, then restart the server.
- Empty schedule: ensure the dentist has a linked practitioner record and has enabled at least one weekly availability window.
- Migration error: confirm the CLI is linked to the intended project and migrations have not been manually modified after application.
- Access denied: verify `profiles.role`, `organization_id`, practitioner linkage, and the latest migrations.
- Port already used: run `npm run dev -- -p 3001`.
