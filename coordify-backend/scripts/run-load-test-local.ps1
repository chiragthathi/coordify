param(
  [string]$Namespace = "coordify",
  [string]$Service = "api-load-balancer",
  [int]$LocalPort = 4100,
  [int]$RemotePort = 80,
  [string]$Profile = "local-stepped",
  [string]$Duration = "",
  [switch]$NoThresholds = $true
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Path $PSScriptRoot -Parent
Push-Location $repoRoot

$portForwardPattern = "port-forward -n $Namespace svc/$Service ${LocalPort}:${RemotePort}"
$existingPortForward = Get-CimInstance Win32_Process |
  Where-Object {
    $_.Name -match 'kubectl(\.exe)?' -and
    $_.CommandLine -match [regex]::Escape($portForwardPattern)
  }

if ($existingPortForward) {
  $existingPortForward | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
}

$portForwardArgs = "port-forward -n $Namespace svc/$Service ${LocalPort}:${RemotePort}"
$stdoutLog = Join-Path $repoRoot "load-tests/port-forward.stdout.log"
$stderrLog = Join-Path $repoRoot "load-tests/port-forward.stderr.log"

$portForwardProcess = Start-Process -FilePath "kubectl" -ArgumentList $portForwardArgs -PassThru -NoNewWindow -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog

try {
  $healthUrl = "http://127.0.0.1:$LocalPort/health"
  $connected = $false

  for ($i = 0; $i -lt 20; $i += 1) {
    try {
      $resp = Invoke-WebRequest -UseBasicParsing -Uri $healthUrl -TimeoutSec 2
      if ($resp.StatusCode -eq 200) {
        $connected = $true
        break
      }
    } catch {
      # Retry quickly while port-forward is warming up.
    }
  }

  if (-not $connected) {
    throw "Port-forward did not become ready on $healthUrl"
  }

  $k6Path = Get-ChildItem -Path $repoRoot -Recurse -Filter k6.exe -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty FullName

  if (-not $k6Path) {
    throw "k6.exe not found under $repoRoot"
  }

  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $summaryPath = Join-Path $repoRoot "load-tests/k6-summary-$timestamp.json"
  $outputPath = Join-Path $repoRoot "load-tests/k6-output-$timestamp.txt"

  $env:BASE_URL = "http://127.0.0.1:$LocalPort"
  $env:LOAD_PROFILE = $Profile

  $k6Args = @("run", "load-tests/k6-60k.js", "--summary-export", $summaryPath)
  if ($Duration) {
    $k6Args += @("--duration", $Duration)
  }
  if ($NoThresholds) {
    $k6Args += "--no-thresholds"
  }

  Write-Host "Running k6 with BASE_URL=$env:BASE_URL LOAD_PROFILE=$env:LOAD_PROFILE"
  Write-Host "Summary: $summaryPath"
  Write-Host "Output : $outputPath"

  & $k6Path @k6Args | Tee-Object -FilePath $outputPath
  $k6Exit = $LASTEXITCODE

  if ($k6Exit -ne 0) {
    throw "k6 exited with code $k6Exit"
  }

  Write-Host "Load test completed successfully."
} finally {
  if ($portForwardProcess -and -not $portForwardProcess.HasExited) {
    Stop-Process -Id $portForwardProcess.Id -Force
  }
  Pop-Location
}
