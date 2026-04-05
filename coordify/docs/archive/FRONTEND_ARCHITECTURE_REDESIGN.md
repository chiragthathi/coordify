# Frontend Architecture Redesign (Production-Ready)

## Goals
- Scale frontend codebase by feature boundaries.
- Keep UX responsive with route-level lazy loading and request caching.
- Make API integration clean for microservices + API Gateway.
- Improve maintainability with centralized providers and shared utilities.
- Add observability and secure defaults for production operations.

## Recommended Folder Structure

```text
src/
  app/
    providers/
      AppProviders.jsx
    query/
      queryClient.js
    router/
      AppRouter.jsx
    store/
      authStore.js
      uiStore.js

  monitoring/
    sentry.js

  features/
    projects/
      api/projectService.js
      hooks/useProjects.js
    tasks/
      api/taskService.js
      hooks/useTasks.js
    team/api/teamService.js
    notifications/api/notificationService.js
    comments/api/commentService.js
    settings/api/settingsService.js
    reports/api/reportService.js

  shared/
    api/
      httpClient.js
      errorHandler.js
      contract.js
      tokenStorage.js
      mockApi.js
    config/
      env.js
    constants/
      queryKeys.js
    components/
      feedback/PageLoader.jsx
      virtualization/VirtualizedList.jsx
    hooks/
      useDebounce.js

  services/
    api.js (compatibility export layer)

.env
.env.development
.env.production
```

## Design Decisions

### 1) State Strategy (Scalable)
- Use React Query for server state (projects/tasks/users/notifications).
- Use Zustand for global client state (session snapshot, UI state).
- Keep Context for stable concerns already in app (theme/auth).

Why:
- Clear separation of client state vs server state.
- Reduced rerenders and less prop-drilling.
- Built-in caching, retry and refetch policies.

### 2) Routing and Code Splitting
- Each top-level page is lazy-loaded with React.lazy.
- Suspense fallback uses skeleton-first page loading placeholders.
- Global Suspense boundary wraps app router for consistent loading UX.

Why:
- Smaller initial JS payload.
- Faster first paint on login/dashboard entry.

### 3) API Integration
- `shared/api/httpClient.js` is the centralized Axios client.
- Base URL is gateway-aware (`VITE_API_GATEWAY_URL`).
- Endpoints are versioned (`/api/v1/projects`, `/api/v1/tasks`).
- Request interceptor attaches bearer token.
- Response interceptor handles token refresh flow, retry (max 2), 401 handling, and normalized errors.
- Supports cancellation via `AbortSignal` for query lifecycle safety.
- Feature services are separated by domain (`features/*/api`).

Why:
- One place to manage authentication headers, timeout, and retry semantics.
- Easy to swap mock implementations with gateway-backed calls.
- Strong contract for API versioning and routing through gateway.

### 4) Performance Controls
- Debounced project search (`useDebounce`) to reduce expensive filter cycles.
- Memoized project card (`React.memo`) to avoid unnecessary rerenders.
- Reusable `VirtualizedList` available for large task/member datasets.
- Query prefetch on navigation intent (hover/focus).
- Structured query keys with parameters for precise deduplication and invalidation.

## Snippets

### Lazy Loading Routes

```jsx
const Dashboard = lazy(() => import('../../pages/Dashboard').then((m) => ({ default: m.Dashboard })))

<Route path="/" element={withSuspense(<Dashboard />)} />
```

### Centralized API Layer

```js
export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL,
  timeout: 15000,
})

// example endpoint paths via API prefix (/api/v1)
httpClient.get('/api/v1/projects')
httpClient.get('/api/v1/tasks')

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

httpClient.interceptors.response.use(null, async (error) => {
  const config = error.config
  if (!config || config.__retryCount >= 2) return Promise.reject(error)

  config.__retryCount = (config.__retryCount || 0) + 1
  return httpClient(config)
})
```

### State Setup (React Query + Zustand)

```js
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 600_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setSession: ({ user, accessToken }) => set({ user, accessToken, isAuthenticated: Boolean(accessToken) }),
}))
```

### Feature-Level Hooks

```js
export const useProjects = ({ page, filters }) => {
  return useQuery({
    queryKey: ['projects', { page, filters }],
    queryFn: ({ signal }) => getProjects({ page, filters, signal }),
  })
}
```

### Global Loading Boundary

```jsx
<Suspense fallback={<PageLoader />}>
  <AppRouter />
</Suspense>
```

### Optimistic Updates

```js
useMutation({
  mutationFn: ({ taskId, updates }) => taskService.update(taskId, updates),
  onMutate: async ({ taskId, updates }) => {
    await queryClient.cancelQueries({ queryKey: ['tasks'] })
    const previousTasks = queryClient.getQueryData(['tasks'])
    queryClient.setQueryData(['tasks'], (old = []) =>
      old.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
    )
    return { previousTasks }
  },
  onError: (_error, _vars, context) => {
    queryClient.setQueryData(['tasks'], context.previousTasks)
  },
})
```

### Prefetching

```js
queryClient.prefetchQuery({
  queryKey: ['projects', { page: 1, filters: {} }],
  queryFn: getProjects,
})
```

### Pagination with Infinite Query

```js
useInfiniteQuery({
  queryKey: ['projects', 'infinite', { limit, filters }],
  queryFn: ({ pageParam = 1, signal }) => getProjects({ page: pageParam, limit, filters, signal }),
  getNextPageParam: (lastPage) => (lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined),
})
```

## Security Guidance
- Do not store refresh tokens in localStorage. Prefer HttpOnly, Secure cookies from API Gateway.
- Keep access token short-lived.
- Do not render unsanitized HTML from API responses.
- Enforce route guards and permission checks at page and component levels.
- Add CSP meta policy in `index.html` to reduce browser-side XSS risk.
- Add UI-level role guards for admin-only controls to avoid unauthorized actions being rendered.

## Accessibility
- Add ARIA labels for search/actions and notification interactions.
- Ensure keyboard support for profile menus (Escape/outside click handling, focus management).

## Build Optimization
- Manual chunk splitting in Vite for vendor bundles (`react`, `queryVendor`, `chartsVendor`, `dndVendor`).
- Keep tree-shaking effective by modular imports and avoiding side-effectful utility files.
- Use `vite build` in CI to catch chunk growth regressions.

## Error and Monitoring
- Normalize API errors in one shape (`status`, `code`, `message`) via `shared/api/errorHandler.js`.
- Standardize successful responses to `{ success, data, error, meta }` via `shared/api/contract.js`.
- Initialize Sentry in `src/monitoring/sentry.js` using `VITE_SENTRY_DSN`.
- Capture crashes, API failures, and performance traces in production.

## Realtime (Optional)
- Add WebSocket client (`shared/realtime/socketClient.js`) and notification hook.
- Use `VITE_WS_NOTIFICATIONS_URL` for live notification and activity feed updates.

## Environment Profiles
- `.env`: local defaults.
- `.env.development`: local development values.
- `.env.production`: production gateway URL and flags.
- Core vars:
  - `VITE_API_GATEWAY_URL`
  - `VITE_API_PREFIX`
  - `VITE_USE_MOCK_API`
  - `VITE_SENTRY_DSN`
  - `VITE_APP_ENV`
  - `VITE_ENABLE_NEW_DASHBOARD`
  - `VITE_WS_NOTIFICATIONS_URL`

## Migration Path
1. Keep current pages working through `src/services/api.js` compatibility exports.
2. Move page-by-page data logic into feature hooks (`useProjects`, `useTasks`).
3. Replace mock services with gateway-backed API calls in each feature service.
4. Enable Sentry DSN and validate alerts in staging.
5. Adopt `VirtualizedList` in heavy views (tasks/team tables) once datasets grow.
