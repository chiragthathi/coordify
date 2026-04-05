# RabbitMQ Event Flow

This project now supports asynchronous task event processing with RabbitMQ and DLQ.

## Main Flow

1. User creates a task via Tasks Service (`POST /api/v1/tasks`).
2. Tasks Service publishes `task.created` event to exchange `coordify.events`.
3. Message broker routes service events into service-specific queues.
4. Multiple Notifications Worker instances consume all notification queues.
5. Worker executes notification service logic and creates notification record in storage.

This follows the pattern:

```text
Producers (All Services)
	↓
Message Broker (Queue)
	↓
Multiple Notification Workers
	↓
Notification Service Logic
```

Service queue model (one queue per service):

- `coordify.auth.notifications.q` bound to `auth.notifications`
- `coordify.project.notifications.q` bound to `project.notifications`
- `coordify.task.notifications.q` bound to `task.notifications`
- `coordify.team.notifications.q` bound to `team.notifications`
- `coordify.reports.notifications.q` bound to `reports.notifications`
- `coordify.settings.notifications.q` bound to `settings.notifications`

## Dead Letter Queue (DLQ)

- Main queue: `coordify.task.events.q`
- DLX: `coordify.events.dlx`
- DLQ: `coordify.task.events.dlq`
- Dead routing key: `task.created.dead`

If consumer processing fails or payload is invalid, message is `nack`ed without requeue and sent to DLQ.

## Logging Storage

Queue operations are persisted as JSON line logs:

- Tasks publisher logs: `services/tasks-service/logs/tasks-service.log`
- Notifications worker logs: `services/notifications-service/logs/notifications-service.log`

## Running Infra

From backend root:

```bash
docker compose up -d
```

RabbitMQ UI is available at:

- http://localhost:15672
- user/pass: `guest` / `guest`

## Enable Queue in Services

Set in both tasks-service and notifications-service `.env`:

- `RABBITMQ_ENABLED=true`
- `RABBITMQ_URL=amqp://localhost:5672`

Then start API services and notifications workers:

```bash
npm start --prefix ./services/tasks-service
npm start --prefix ./services/notifications-service
npm run worker --prefix ./services/notifications-service
```

To run multiple workers in parallel on PowerShell, run `npm run worker` in separate terminals with unique ids:

```bash
$env:WORKER_ID='worker-1'; $env:RABBITMQ_ENABLED='true'; npm run worker --prefix ./services/notifications-service
$env:WORKER_ID='worker-2'; $env:RABBITMQ_ENABLED='true'; npm run worker --prefix ./services/notifications-service
```

Or use `./scripts/start-all.ps1`, which now starts multiple notification workers automatically. Override count with:

```bash
$env:NOTIFICATION_WORKER_COUNT='4'; ./scripts/start-all.ps1
```
