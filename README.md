# Coordify Project

Coordify is a full-stack project management platform with a React frontend and a Node.js microservices backend.

It includes:

- Authentication and role-based access control
- Projects, tasks, Kanban, and team management
- Notifications using RabbitMQ events + worker
- Reports and settings modules
- Docker-based local development stack

## Repository Structure

- `coordify/`: Frontend (React + Vite)
- `coordify-backend/`: Backend microservices, infrastructure, Docker Compose

## Prerequisites

Install these tools before running locally:

1. Docker Desktop
2. Node.js 20+ (required if you run services outside Docker)

## Start Project (Recommended)

Use Docker Compose to start full stack.

1. Open terminal in `coordify-backend`
2. Run:

```powershell
docker compose up -d
```

3. Verify services:

```powershell
docker compose ps
```

4. Open frontend:

- `http://localhost:5173`

## Default Access

- Email: `admin@example.com`
- Password: `admin123`

## Main URLs

- Frontend: `http://localhost:5173`
- API Load Balancer: `http://localhost:4100`
- RabbitMQ UI: `http://localhost:15672`

## Useful Commands

Start stack:

```powershell
docker compose up -d
```

View logs:

```powershell
docker compose logs --tail 100
```

Stop stack:

```powershell
docker compose down
```

Reset stack with volumes:

```powershell
docker compose down -v
```

## Notes

- Frontend API requests are routed through the gateway/load balancer using `/api/v1/*` paths.
- Services persist data in MongoDB and use Redis + RabbitMQ for cache/event workflows.
