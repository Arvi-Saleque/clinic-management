# Antigravity Dental Clinic Setup

## 1. Requirements
- Google Antigravity 2.0 / IDE
- Node.js current LTS
- npm
- Chrome current stable
- A Supabase DEVELOPMENT/TEST project (do not point autonomous MCP at production patient data)

## 2. Put this package in the repository root
After extraction, the project should contain:

```
.agents/
  mcp_config.json
  mcp_config.write.example.json
  rules/clinic-core-rules.md
  skills/clinic-workflow/SKILL.md
AGENTS.md
START_PROMPT.md
```

## 3. Set Supabase Project Ref
Open `.agents/mcp_config.json` and replace:

`YOUR_SUPABASE_PROJECT_REF`

with the project ref from your DEVELOPMENT/TEST Supabase project.

Keep `read_only=true` for the initial audit.

## 4. Install official Supabase Agent Skills
Run from repository root:

```powershell
npx skills add supabase/agent-skills -a antigravity
```

Select/install these if prompted:
- `supabase`
- `supabase-postgres-best-practices`

If you want a non-interactive explicit install:

```powershell
npx skills add supabase/agent-skills --skill supabase --skill supabase-postgres-best-practices -a antigravity -y
```

Confirm they exist under `.agents\skills\` or appear in Antigravity's available skills.

## 5. Supabase MCP authentication
Open Antigravity → Settings → Customizations → Installed MCP Servers.
The workspace `.agents/mcp_config.json` should be discovered.

For the Supabase server, click Authenticate if shown. Complete Supabase OAuth in the browser and authorize only the organization/project needed for development.

Test with:

`Use the Supabase MCP and list the tables in the configured project. Do not modify anything.`

## 6. Context7
The package registers Context7 at:

`https://mcp.context7.com/mcp`

It can work without an API key with lower limits. For higher limits, get a Context7 API key and add:

```json
"headers": {
  "Authorization": "Bearer YOUR_CONTEXT7_API_KEY"
}
```

to the Context7 server entry.

Test:

`Use Context7 to check the current documentation for the exact Supabase/Next.js API used by this repository.`

## 7. Browser testing
Do NOT install duplicate Chrome DevTools MCP first.
Antigravity 2.0 already includes Chrome DevTools integration in the browser sub-agent.

Test with:

`/browser Open my local development app and inspect the console and network errors.`

## 8. Optional GitHub MCP
If repository/PR/history access is useful:
Antigravity → Settings → Customizations → Add MCP → search `GitHub` → Add → Authenticate.

Keep this optional for a local-only refactor.

## 9. Optional Playwright MCP
Antigravity's built-in browser is enough for initial implementation. Add Playwright only when you want persistent/structured browser automation or test-generation loops.

The disabled example is in `.agents/mcp_config.write.example.json`:

```json
"playwright-optional": {
  "command": "npx",
  "args": ["-y", "@playwright/mcp@latest"],
  "disabled": true
}
```

If enabled, Node.js 18+ is required.

## 10. Start Antigravity
Open a fresh Antigravity conversation after skills/config changes.
Paste the contents of `START_PROMPT.md`.

## 11. Recommended workflow
- Audit with Supabase read-only MCP.
- Let agent write code and migration files.
- Review migration SQL manually.
- Apply migrations yourself to dev/test Supabase.
- Refresh/regenerate types if needed.
- Run app.
- Use built-in browser sub-agent for doctor/patient E2E verification.
- Only after successful dev/test verification consider deployment.

## 12. Write mode
Do NOT rename the write example over the main config casually.
If you explicitly want MCP to apply migrations or deploy functions in a development project, inspect `.agents/mcp_config.write.example.json`, replace the project ref, then copy only the specific capabilities you need into the active config.
