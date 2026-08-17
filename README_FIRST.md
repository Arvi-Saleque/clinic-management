# Antigravity Clinic Skills Installer v2

This fixes the Windows timeout from the earlier installer.

The old installer downloaded the entire `agentic-awesome-skills` repository ZIP.
This version downloads only the reviewed skill files, one small file at a time, with `curl.exe` retries.

## Run

Copy/extract these files into the Dental Clinic project root.

Then open PowerShell in the project root and run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\install-clinic-skills-v2.ps1
```

Do not run anything else after that. Send the entire terminal output back.

`verify-clinic-skills.ps1` is for the next step only.

If v2 still fails, use `ANTIGRAVITY_DIRECT_INSTALL_PROMPT.md` directly inside Antigravity.
