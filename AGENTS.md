# Repository Agent Guide

This is an existing dental clinic management application. Preserve working behavior and improve the current codebase rather than rebuilding blindly.

Before any large change:
1. Read `.agents/rules/clinic-core-rules.md`.
2. Use the `clinic-workflow` skill for scheduling, doctor/patient, appointment, prescription, dental chart, follow-up or clinical history tasks.
3. Audit existing routes/schema/components before creating new ones.
4. Prefer read-only Supabase MCP during discovery.
5. Create migration SQL files for manual application unless explicitly authorized to execute them.
6. Use Antigravity's built-in browser sub-agent for end-to-end verification.
7. **ALWAYS write and update the comprehensive task result, diagnosis, and technical summary in `result.md` on EVERY task without needing to be reminded.**

Do not mark a workflow complete until it has been exercised in the browser against real application data/test fixtures.
