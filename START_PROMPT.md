# Paste this into Antigravity after setup

Use the `clinic-workflow` skill and repository rules for this task.

This is an existing dental clinic management project. Do NOT start by rewriting it.

First perform a complete audit of the existing implementation relevant to:
- doctor services and per-service duration;
- next-10-day doctor availability with multiple intervals/day;
- appointment slot calculation and conflict prevention;
- patient service → doctor → available time → booking flow;
- doctor dashboard next-patient/today schedule flow;
- consultation/check-in;
- dental chart;
- diagnosis and actual performed treatment;
- prescription;
- reports/attachments;
- follow-up recommendation and follow-up booking;
- longitudinal patient history;
- Supabase schema, migrations, RLS, indexes and authorization.

Use Supabase MCP in read-only mode during the audit. Inspect the actual database instead of guessing from code. Use Context7 when current framework/library documentation is needed.

Before changing code, give me a concise implementation plan containing:
1. what already works;
2. what is broken/disconnected;
3. canonical tables/modules to keep;
4. duplicate/obsolete paths to remove later;
5. database changes required;
6. files/modules you expect to modify;
7. concurrency/double-booking strategy;
8. authorization/RLS risks.

Then implement the complete workflow end-to-end. Reuse good existing UI and architecture. Do not create duplicate appointment/patient/prescription systems.

IMPORTANT DATABASE RULE:
Do not directly apply destructive Supabase migrations. If database changes are required, create clean migration SQL files in the repository and tell me exactly which file to copy/apply manually in Supabase.

After implementation, use Antigravity's built-in browser sub-agent to run the real doctor and patient workflow. Fix console/network/runtime errors you find. Verify desktop and at least one mobile/tablet viewport.

Do not declare completion until the end-to-end acceptance flow is actually verified.
