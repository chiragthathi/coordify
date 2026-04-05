$ErrorActionPreference = 'Stop'
$base = 'http://localhost:4000'
$email = 'pujaranirmit@gmail.com'

$result = [ordered]@{
  email = $email
  teamMemberId = $null
  projectId = $null
  projectName = $null
  assignmentVerified = $false
  error = $null
}

try {
  try {
    Invoke-RestMethod -Uri "$base/api/v1/team/invite" -Method Post -Headers @{ 'x-user-role'='admin'; 'x-user-id'='user_admin_001' } -ContentType 'application/json' -Body (@{ email=$email; role='member' } | ConvertTo-Json) | Out-Null
  } catch {
    # ignore if already exists
  }

  try {
    Invoke-RestMethod -Uri "$base/api/v1/team/invitations/accept-email" -Method Post -ContentType 'application/json' -Body (@{ email=$email } | ConvertTo-Json) | Out-Null
  } catch {
    # ignore if already accepted
  }

  $team = Invoke-RestMethod -Uri "$base/api/v1/team" -Method Get -Headers @{ 'x-user-role'='admin'; 'x-user-id'='user_admin_001' }
  $member = @($team.data | Where-Object { $_.email -eq $email })[0]
  if (-not $member) { throw "Team member not found: $email" }

  $result.teamMemberId = $member.id

  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $projectName = "Admin Added $stamp"
  $project = Invoke-RestMethod -Uri "$base/api/v1/projects" -Method Post -Headers @{ 'x-user-role'='admin'; 'x-user-id'='user_admin_001' } -ContentType 'application/json' -Body (@{ name=$projectName; description='Project created by admin to verify member assignment'; owner='user_admin_001'; status='planning'; priority='medium' } | ConvertTo-Json)

  $result.projectId = $project.data.id
  $result.projectName = $project.data.name

  $payload = @{ memberId=$member.id; memberEmail=$email } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/api/v1/projects/$($project.data.id)/members" -Method Post -Headers @{ 'x-user-role'='admin'; 'x-user-id'='user_admin_001' } -ContentType 'application/json' -Body $payload | Out-Null

  $verify = Invoke-RestMethod -Uri "$base/api/v1/projects/$($project.data.id)" -Method Get -Headers @{ 'x-user-role'='admin'; 'x-user-id'='user_admin_001' }
  $result.assignmentVerified = [bool]($verify.data.memberIds -contains $member.id)
}
catch {
  $result.error = $_.Exception.Message
}

$result | ConvertTo-Json -Depth 6 | Out-File -FilePath '.\assign_puja_result.json' -Encoding utf8
