# Clinic Care (website-code) — docs index

> **2026-08-14 delivery note:** The premium nine-module implementation now supersedes older `PLANNED`/`stub` status text in the historical repository scan below. Use the root `README.md` and `IMPLEMENTATION_GUIDE.md` as the current run and feature reference.

> **For AI agents:** if you are reading this for the first time, read [PROJECT_MAP.md](PROJECT_MAP.md) first, then jump to the section relevant to your task using the tags below. This whole set was generated 2026-08-10 from the working tree (which is largely uncommitted — see [FRESHNESS_REPORT.md](FRESHNESS_REPORT.md)).

## Top-level orientation

- [PROJECT_MAP.md](PROJECT_MAP.md) — one-page map: what this is, layer ownership, where to start
- [MODULE_INDEX.md](MODULE_INDEX.md) — every directory under `src/`, `supabase/`, what it does, its key files
- [GLOSSARY.md](GLOSSARY.md) — project-specific terms (Base UI vs Radix, `private` schema, RLS, versioned tables, route groups) — read this before asking "what does X mean?"

## Contracts and data

- [CONTRACTS.md](CONTRACTS.md) — every page route, Server Action, and Supabase RPC, with status (`BUILT` / `BUILT-SIMULATED` / `PLANNED`)
- [DATA_DICTIONARY.md](DATA_DICTIONARY.md) — every one of the 22 database tables, field-by-field, with what's actually seeded live vs. schema-only

## Testing and gates

- [TEST_LANDSCAPE.md](TEST_LANDSCAPE.md) — **no automated tests exist**; what was manually verified live this session and how, what isn't covered at all

## Meta

- [FRESHNESS_REPORT.md](FRESHNESS_REPORT.md) — scan timestamp, what was scanned, recommended next actions (commit the work — nothing is in git history yet beyond the initial scaffold)

## Quick facts for a cold start

- **Stack:** Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind v4 + shadcn/ui (on `@base-ui/react`, not Radix) + Framer Motion + Supabase (Postgres + Auth, RLS-only authorization)
- **Live Supabase project:** `mxywvlekwgrzlewxgfcl` (region `ap-northeast-2`) — 12 migrations pushed, seed data loaded, RLS verified with real signups
- **What works today:** marketing homepage, full auth flow, patient self-registration, role-guarded staff/portal shells
- **What's a stub:** scheduler, online booking, invoices, prescriptions, odontogram, reminders — schema and RLS exist for all of them, no UI yet
- **Biggest risk right now:** the working tree is uncommitted (see [FRESHNESS_REPORT.md](FRESHNESS_REPORT.md) recommended action #1)
