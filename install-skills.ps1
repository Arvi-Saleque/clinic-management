$ErrorActionPreference = "Stop"

Write-Host "Checking Node and npm..."
node --version
npm --version

Write-Host "Installing official Supabase skills for Antigravity at project scope..."
npx skills add supabase/agent-skills --skill supabase --skill supabase-postgres-best-practices -a antigravity -y

Write-Host ""
Write-Host "Done. Verify .agents\skills contains the Supabase skills, then restart/open a fresh Antigravity conversation."
Write-Host "Next: edit .agents\mcp_config.json and replace YOUR_SUPABASE_PROJECT_REF."
