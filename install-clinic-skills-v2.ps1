param(
    [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== Antigravity Clinic Skills Installer v2 ===" -ForegroundColor Cyan
Write-Host "Project root: $ProjectRoot"
Write-Host ""

if (-not (Test-Path $ProjectRoot)) {
    throw "Project root does not exist: $ProjectRoot"
}

$curl = Get-Command curl.exe -ErrorAction SilentlyContinue
if (-not $curl) {
    throw "curl.exe was not found. Windows 10/11 normally includes it. Send this error back instead of installing anything manually."
}

$skillsRoot = Join-Path $ProjectRoot ".agents\skills"
New-Item -ItemType Directory -Force -Path $skillsRoot | Out-Null

$baseUrl = "https://raw.githubusercontent.com/sickn33/agentic-awesome-skills/main/skills"

# Only the reviewed skills required for this clinic project.
$files = @(
    @{ Skill="typescript-expert"; Relative="SKILL.md" },
    @{ Skill="react-best-practices"; Relative="SKILL.md" },
    @{ Skill="react-best-practices"; Relative="AGENTS.md" },
    @{ Skill="nextjs-app-router-patterns"; Relative="SKILL.md" },
    @{ Skill="nextjs-app-router-patterns"; Relative="resources/implementation-playbook.md" },
    @{ Skill="systematic-debugging"; Relative="SKILL.md" },
    @{ Skill="test-driven-development"; Relative="SKILL.md" },
    @{ Skill="e2e-testing-patterns"; Relative="SKILL.md" },
    @{ Skill="e2e-testing-patterns"; Relative="resources/implementation-playbook.md" },
    @{ Skill="code-review-checklist"; Relative="SKILL.md" },
    @{ Skill="auth-implementation-patterns"; Relative="SKILL.md" },
    @{ Skill="auth-implementation-patterns"; Relative="resources/implementation-playbook.md" },
    @{ Skill="api-security-best-practices"; Relative="SKILL.md" }
)

$selectedSkills = @(
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

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $ProjectRoot (".agents\skills-backup\" + $timestamp)
$backedUp = @{}

# Back up only selected target skills if they already exist.
foreach ($skill in $selectedSkills) {
    $dest = Join-Path $skillsRoot $skill
    if (Test-Path $dest) {
        New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null
        Copy-Item -Path $dest -Destination (Join-Path $backupRoot $skill) -Recurse -Force
        $backedUp[$skill] = $true
    }
}

Write-Host "[1/3] Downloading only selected skill files (small downloads)..." -ForegroundColor Yellow

$failed = @()

foreach ($item in $files) {
    $skill = $item.Skill
    $relative = $item.Relative.Replace("\", "/")
    $url = "$baseUrl/$skill/$relative"

    $destDir = Join-Path $skillsRoot $skill
    $relativeWindows = $item.Relative.Replace("/", "\")
    $destPath = Join-Path $destDir $relativeWindows
    $parent = Split-Path $destPath -Parent
    New-Item -ItemType Directory -Force -Path $parent | Out-Null

    Write-Host "  -> $skill/$relative"

    # curl: fail on HTTP errors, follow redirects, retry transient failures.
    & curl.exe `
        --fail `
        --location `
        --silent `
        --show-error `
        --retry 5 `
        --retry-delay 2 `
        --connect-timeout 15 `
        --max-time 90 `
        --output $destPath `
        $url

    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $destPath) -or (Get-Item $destPath).Length -lt 20) {
        $failed += "$skill/$relative"
        Write-Host "     [FAILED]" -ForegroundColor Red
    } else {
        Write-Host "     [OK]" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "[2/3] Verifying SKILL.md files..." -ForegroundColor Yellow

$installed = @()
$missingSkills = @()

foreach ($skill in $selectedSkills) {
    $skillFile = Join-Path (Join-Path $skillsRoot $skill) "SKILL.md"
    if (Test-Path $skillFile) {
        $firstLines = Get-Content $skillFile -TotalCount 8 -ErrorAction SilentlyContinue
        if (($firstLines -join "`n") -match "name:\s*$([regex]::Escape($skill))") {
            Write-Host "  [OK] $skill" -ForegroundColor Green
            $installed += $skill
        } else {
            Write-Host "  [INVALID] $skill (unexpected SKILL.md)" -ForegroundColor Red
            $missingSkills += $skill
        }
    } else {
        Write-Host "  [MISSING] $skill" -ForegroundColor Red
        $missingSkills += $skill
    }
}

Write-Host ""
Write-Host "[3/3] Result" -ForegroundColor Yellow
Write-Host "Installed/verified: $($installed.Count) / $($selectedSkills.Count)" -ForegroundColor Cyan

if ($failed.Count -gt 0) {
    Write-Host ""
    Write-Host "Individual file downloads that failed:" -ForegroundColor Red
    $failed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}

if ($missingSkills.Count -gt 0) {
    Write-Host ""
    Write-Host "Skills not fully verified:" -ForegroundColor Red
    $missingSkills | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}

if ($backedUp.Count -gt 0) {
    Write-Host ""
    Write-Host "Existing selected skills were backed up at:" -ForegroundColor DarkYellow
    Write-Host "  $backupRoot"
}

Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Cyan
Write-Host "- Existing clinic-workflow/Supabase skills were not removed."
Write-Host "- Application source code was not touched."
Write-Host "- Supabase/database was not touched."
Write-Host "- MCP configuration was not touched."
Write-Host "- UI UX Pro Max is intentionally NOT installed by this script; do that separately later."
Write-Host ""

if ($missingSkills.Count -eq 0) {
    Write-Host "SUCCESS. Send this entire terminal output back before doing anything else." -ForegroundColor Green
    exit 0
} else {
    Write-Host "PARTIAL/FAILED. Send this entire terminal output back. Do not retry manually." -ForegroundColor Red
    exit 1
}
