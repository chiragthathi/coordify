$services = @(
  'auth-service',
  'projects-service',
  'tasks-service',
  'team-service',
  'notifications-service',
  'reports-service',
  'settings-service'
)

$root = Split-Path -Parent $PSScriptRoot
$notificationWorkerCount = if ($env:NOTIFICATION_WORKER_COUNT) { [int]$env:NOTIFICATION_WORKER_COUNT } else { 2 }

$gatewayPath = Join-Path $root "services/api-gateway"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$gatewayPath'; `$env:PORT='4000'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$gatewayPath'; `$env:PORT='4001'; npm run dev"

$lbPath = Join-Path $root "services/api-load-balancer"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$lbPath'; npm run dev"

foreach ($service in $services) {
  $path = Join-Path $root "services/$service"

  if (
    $service -eq 'auth-service' -or
    $service -eq 'projects-service' -or
    $service -eq 'tasks-service' -or
    $service -eq 'team-service' -or
    $service -eq 'reports-service' -or
    $service -eq 'settings-service'
  ) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$path'; `$env:RABBITMQ_ENABLED='true'; npm run dev"
    continue
  }

  if ($service -eq 'notifications-service') {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$path'; `$env:RABBITMQ_ENABLED='true'; npm run dev"
    continue
  }

  Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$path'; npm run dev"
}

$notificationsPath = Join-Path $root "services/notifications-service"
for ($i = 1; $i -le $notificationWorkerCount; $i++) {
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$notificationsPath'; `$env:RABBITMQ_ENABLED='true'; `$env:WORKER_ID='worker-$i'; npm run worker"
}

Write-Host "Started all services, 2 API gateways, load balancer, and $notificationWorkerCount notifications worker(s)."
