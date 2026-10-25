# Run PowerShell as Administrator. Required once per machine before URL Rewrite
# can set custom server variables (X-Forwarded-*) in web.config.
$appcmd = "$env:windir\system32\inetsrv\appcmd.exe"
if (-not (Test-Path $appcmd)) {
  Write-Error "appcmd not found. Is IIS installed?"
  exit 1
}
& $appcmd unlock config -section:system.webServer/rewrite/allowedServerVariables
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Unlocked: system.webServer/rewrite/allowedServerVariables" -ForegroundColor Green
Write-Host "Restart IIS (iisreset) or recycle the site if variables still not applied." -ForegroundColor Yellow
