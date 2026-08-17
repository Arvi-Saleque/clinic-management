param(
    [string]$ProjectRoot = (Get-Location).Path
)

$skillsRoot = Join-Path $ProjectRoot ".agents\skills"

$expected = @(
    "clinic-workflow",
    "supabase",
    "supabase-postgres-best-practices",
    "typescript-expert",
    "react-best-practices",
    "nextjs-app-router-patterns",
    "systematic-debugging",
    "test-driven-development",
    "e2e-testing-patterns",
    "code-review-checklist",
    "auth-implementation-patterns",
    "api-security-best-practices"
)

Write-Host ""
Write-Host "=== Antigravity Clinic Skill Verification ===" -ForegroundColor Cyan
Write-Host ""

foreach ($skill in $expected) {
    $file = Join-Path (Join-Path $skillsRoot $skill) "SKILL.md"
    if (Test-Path $file) {
        Write-Host "[OK]      $skill" -ForegroundColor Green
    } else {
        Write-Host "[MISSING] $skill" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Send this output back. Do not start Phase 2 yet." -ForegroundColor Cyan
