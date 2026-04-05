# Kubernetes Deployment and Load Test

## 1) Build and tag images

Run from `coordify-backend` root:

```powershell
docker build -t coordify/api-gateway:latest ./services/api-gateway
docker build -t coordify/api-load-balancer:latest ./services/api-load-balancer
docker build -t coordify/auth-service:latest ./services/auth-service
docker build -t coordify/projects-service:latest ./services/projects-service
docker build -t coordify/tasks-service:latest ./services/tasks-service
docker build -t coordify/team-service:latest ./services/team-service
docker build -t coordify/notifications-service:latest ./services/notifications-service
docker build -t coordify/reports-service:latest ./services/reports-service
docker build -t coordify/settings-service:latest ./services/settings-service
```

## 2) Apply manifests

```powershell
kubectl apply -f ./k8s/coordify-backend.yaml
```

## 3) Update secrets

Do not commit real keys into git. Patch them at runtime:

```powershell
kubectl -n coordify create secret generic coordify-secrets `
  --from-literal=JWT_SECRET="your-jwt-secret" `
  --from-literal=GEMINI_API_KEY="your-gemini-api-key" `
  --dry-run=client -o yaml | kubectl apply -f -
```

## 4) Verify notifications autoscaling

```powershell
kubectl -n coordify get hpa notifications-service-hpa -w
kubectl -n coordify get pods -l app=notifications-service -w
```

## 5) Run 50k-60k load test

Install k6 and execute:

```powershell
k6 run ./load-tests/k6-60k.js -e BASE_URL=http://<api-load-balancer-ip>
```

If `http_req_failed` rises over 2% or P95 exceeds 1200ms, increase replicas for hot services:

```powershell
kubectl -n coordify scale deploy notifications-service --replicas=8
kubectl -n coordify scale deploy api-gateway --replicas=4
kubectl -n coordify scale deploy reports-service --replicas=4
```
