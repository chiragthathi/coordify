# Coordify Backend (Microservices)

This backend is fully separated from the frontend and organized as independent Express microservices.

## Services

- auth-service
- projects-service
- tasks-service
- team-service
- notifications-service
- reports-service
- settings-service
- api-gateway

Each service has its own:
- Express server
- package.json
- environment config
- tests

## Run one service

Example:

npm install --prefix ./services/auth-service
npm run dev --prefix ./services/auth-service

## Test one service

npm test --prefix ./services/auth-service

## Initialize Mongo Databases

Using default local Mongo URI:

npm run db:init

Databases created independently per service:

- coordify_auth_service
- coordify_projects_service
- coordify_tasks_service
- coordify_team_service
- coordify_notifications_service
- coordify_reports_service
- coordify_settings_service
- coordify_api_gateway_service

## Start all services

PowerShell:

./scripts/start-all.ps1

## Base routes

- auth-service: /api/v1/auth
- projects-service: /api/v1/projects
- tasks-service: /api/v1/tasks
- team-service: /api/v1/team
- notifications-service: /api/v1/notifications
- reports-service: /api/v1/reports
- settings-service: /api/v1/settings
- api-gateway: /api/v1/gateway

## Ports

- api-gateway: 4000
- auth-service: 4001
- projects-service: 4002
- tasks-service: 4003
- team-service: 4004
- notifications-service: 4005
- reports-service: 4006
- settings-service: 4007

## Docker Compose (recommended feasible path)

1. Create env file for secrets:

```powershell
Copy-Item .env.example .env
```

2. Set `GEMINI_API_KEY` and `JWT_SECRET` in `.env`.

3. Run production-like stack:

```powershell
docker compose -f docker-compose.prod.yml up --build -d
```

4. For local development compose (hot reload):

```powershell
docker compose -f docker-compose.yml up -d
```
