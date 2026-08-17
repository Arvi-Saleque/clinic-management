# Install Reviewed Clinic Engineering Skills — Setup Only

Do NOT modify any Dental Clinic application code or database in this task.

The PowerShell/npm full-repository installer timed out, so install the workspace skills directly.

Existing workspace items such as `AGENTS.md`, `.agents/rules/`, `clinic-workflow`, Supabase skills, and MCP configuration MUST remain unchanged.

Install only these skills from:
https://github.com/sickn33/agentic-awesome-skills

into:
`.agents/skills/<skill-name>/`

Skills:
- typescript-expert
- react-best-practices
- nextjs-app-router-patterns
- systematic-debugging
- test-driven-development
- e2e-testing-patterns
- code-review-checklist
- auth-implementation-patterns
- api-security-best-practices

For every skill:
1. Retrieve its current `SKILL.md` from the upstream `main` branch.
2. Also retrieve directly referenced local resources required by the SKILL.md when present.
3. Do not clone/download the entire repository if individual files can be fetched.
4. If a target skill already exists, back it up under `.agents/skills-backup/<timestamp>/`.
5. Verify each final `.agents/skills/<skill-name>/SKILL.md` exists and its YAML `name:` matches the directory.

Do NOT:
- edit source application files
- edit migrations
- touch Supabase
- edit `.agents/mcp_config.json`
- start Phase 2
- install unrelated skills

At the end return only:
- installed skills
- missing skills
- backups created
- final `.agents/skills/` directory list
- confirmation that app/database/MCP were untouched

Then STOP.
