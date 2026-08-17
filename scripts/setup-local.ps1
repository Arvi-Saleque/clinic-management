$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectDir

if (-not (Test-Path ".env.local")) {
  Copy-Item ".env.local.example" ".env.local"
  Write-Host "Created .env.local. Add the three Supabase values before using live data."
}

Write-Host "Installing dependencies..."
npm install

Write-Host "Running type validation..."
npm run typecheck

Write-Host "Creating a production build..."
npm run build

Write-Host "Setup complete. Run: npm run dev"
Write-Host "Visual demo: http://localhost:3000/workspace-demo"
