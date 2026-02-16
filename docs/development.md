# FunMagic AI - Development Guide

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.0+
- [Docker](https://docker.com/) + Docker Compose
- Node.js 20+ (for some tooling)

### Setup

```bash
# 1. Clone and install dependencies
git clone <repo-url>
cd funmagic-ai
bun install

# 2. Start infrastructure (PostgreSQL, Redis, MinIO)
bun run infra:up

# 3. Copy environment file
cp .env.example .env

# 4. Run database migrations
bun run db:migrate

# 5. Start all services in development
bun run dev

# 6. (Optional) Start the studio worker separately
bun run dev:worker:studio
```

### Available Services

| Service | URL | Purpose |
|---------|-----|---------|
| Web App (Vue 3) | http://localhost:3002 | Public-facing app |
| Admin App (Vue 3) | http://localhost:3003 | Admin dashboard |
| Backend API | http://localhost:8000 | Hono REST API + SSE |
| Backend Metrics | http://localhost:8000/metrics | Prometheus metrics (backend) |
| Worker Metrics | http://localhost:9090/metrics | Prometheus metrics (ai-tasks worker) |
| Studio Worker Metrics | http://localhost:9091/metrics | Prometheus metrics (studio worker) |
| MinIO Console | http://localhost:9001 | S3 storage UI |
| Drizzle Studio | `bun run db:studio` | Database UI |
| OpenAPI Spec | http://localhost:8000/openapi.json | API specification |
| OpenAPI Docs | http://localhost:8000/doc | API documentation UI |

### Individual Service Commands

```bash
bun run dev:backend        # Backend API only
bun run dev:worker         # AI tasks worker only
bun run dev:worker:studio  # Studio worker only
bun run dev:web            # Web app only
bun run dev:admin          # Admin app only
```

---

## Commands Reference

All scripts from root `package.json`:

| Command | Description |
|---------|-------------|
| `bun run dev` | Start all services in parallel (backend, worker, web, admin) |
| `bun run dev:backend` | Start backend API server (:8000) |
| `bun run dev:worker` | Start AI tasks worker (queue: ai-tasks, metrics :9090) |
| `bun run dev:worker:studio` | Start studio worker (queue: studio-tasks, metrics :9091) |
| `bun run dev:web` | Start web Vue 3 app (:3002) |
| `bun run dev:admin` | Start admin Vue 3 app (:3003) |
| `bun run build` | Build all packages and apps |
| `bun run db:generate` | Generate Drizzle migration from schema changes |
| `bun run db:migrate` | Apply pending database migrations |
| `bun run db:push` | Push schema changes directly (no migration file) |
| `bun run db:studio` | Open Drizzle Studio (database UI) |
| `bun run infra:up` | Start infrastructure containers (PostgreSQL, Redis, MinIO) |
| `bun run infra:down` | Stop infrastructure containers |
| `bun run infra:logs` | Tail infrastructure container logs |
| `bun run stack:up` | Build and start full Docker Compose stack |
| `bun run stack:down` | Stop full Docker Compose stack |
| `bun run stack:logs` | Tail full stack logs |
| `bun run stack:rebuild` | Force rebuild and restart full stack |
| `bun run api:generate` | Regenerate TypeScript types from OpenAPI spec |
| `bun run typecheck` | Run TypeScript type checking across all packages |
| `bun run lint` | Run linting across all packages |

---

## Codebase Structure

### Apps

#### `apps/funmagic-backend/src/` — API Server (Hono)

```
src/
├── index.ts                         # App entry, middleware setup, route mounting
├── schemas/                         # Zod schemas for API validation
│   └── index.ts
├── middleware/
│   ├── auth.ts                      # requireAuth / requireAdmin middleware
│   ├── metrics.ts                   # HTTP metrics (request count, duration) for Prometheus
│   ├── rate-limit.ts                # Redis-backed rate limiter (6 categories, tiered)
│   ├── request-id.ts                # X-Request-Id assignment + request logger
│   └── security-headers.ts          # Security headers (XSS, clickjacking, HSTS, etc.)
├── routes/
│   ├── health.ts                    # Health check endpoints (/health, /health/db, /health/redis)
│   ├── metrics.ts                   # Prometheus /metrics endpoint
│   ├── tools.ts                     # Public: list tools, get by slug
│   ├── tasks.ts                     # Protected: create task, get task, SSE stream
│   ├── assets.ts                    # Protected: upload/download assets (presigned URLs)
│   ├── credits.ts                   # Protected: balance, history; Public: packages list
│   ├── banners.ts                   # Public: list banners; Admin: CRUD banners
│   ├── users.ts                     # Protected: user profile
│   └── admin/
│       ├── index.ts                 # Admin route exports
│       ├── tools.ts                 # Admin tool CRUD
│       ├── tool-types.ts            # Admin tool type CRUD
│       ├── providers.ts             # Web provider CRUD (credentials, rate limit config)
│       ├── admin-providers.ts       # Studio provider CRUD (separate credentials)
│       ├── packages.ts              # Credit package management
│       ├── users.ts                 # User management (roles, listing)
│       ├── tasks.ts                 # Admin task monitoring
│       ├── settings.ts              # Rate limit settings CRUD
│       └── studio/
│           ├── index.ts             # Studio route aggregator
│           ├── projects.ts          # Studio project CRUD
│           ├── generations.ts       # Create generations, SSE streaming
│           ├── batch.ts             # Batch generation (multiple prompts)
│           ├── assets.ts            # Studio asset management
│           ├── providers.ts         # List available studio providers
│           └── schemas.ts           # Zod schemas for studio API
└── lib/
    ├── env.ts                       # Environment variable validation
    ├── errors.ts                    # Error helper factories (notFound, badRequest)
    └── queue.ts                     # BullMQ job creation (addAITaskJob, addStudioTaskJob)
```

#### `apps/funmagic-admin-vue3/src/` — Admin Dashboard (Vue 3)

```
src/
├── views/
│   ├── auth/LoginView.vue
│   └── dashboard/
│       ├── dashboard/               # Dashboard overview
│       ├── tools/                   # Tool management (list, create, edit)
│       ├── tool-types/              # Tool type management
│       ├── providers/               # Web provider management
│       ├── admin-providers/         # Studio provider management
│       ├── users/                   # User management
│       ├── studio/                  # AI Studio chat interface
│       ├── tasks/                   # Task monitoring
│       ├── queue/                   # Queue monitoring
│       ├── content/                 # Banner management
│       ├── billing/                 # Credit package management
│       └── settings/               # Rate limit settings
├── components/
│   ├── tools/                       # ToolConfigForm, etc.
│   ├── shared/                      # PageHeader, StatusBadge
│   └── layout/                      # AdminSidebar, AdminHeader
├── composables/                     # Vue composables
├── stores/                          # Pinia stores
├── lib/
│   └── api.ts                       # openapi-fetch client
└── router/                          # Vue Router config
```

#### `apps/funmagic-web-vue3/src/` — Public Web App (Vue 3)

```
src/
├── views/
│   ├── HomeView.vue                 # Landing page
│   ├── ToolsView.vue                # Tools listing
│   ├── ToolDetailView.vue           # Individual tool page
│   ├── AssetsView.vue               # User asset gallery
│   ├── PricingView.vue              # Credit packages
│   ├── ProfileView.vue              # User profile
│   ├── LoginView.vue                # Login page
│   ├── RegisterView.vue             # Registration page
│   ├── HelpView.vue                 # Help/FAQ page
│   ├── PrivacyView.vue              # Privacy policy
│   ├── TermsView.vue                # Terms of service
│   ├── RateLimitView.vue            # Rate limit info
│   ├── NotFoundView.vue             # 404 page
│   └── tools/
│       ├── FigmeView.vue            # FigMe tool (photo to 3D)
│       ├── BackgroundRemoveView.vue # Background removal tool
│       └── CrystalMemoryView.vue    # Crystal memory tool (point cloud)
├── components/
│   ├── tools/                       # PointCloudViewer, BeforeAfterSlider, etc.
│   ├── upload/                      # Upload components
│   └── layout/                      # Header, footer, nav
├── composables/
│   ├── useFileUpload.ts             # S3 presigned upload logic
│   └── useTaskProgress.ts           # SSE stream handler
├── stores/                          # Pinia stores
├── locales/                         # i18n translations
├── router/                          # Vue Router config
├── lib/
│   ├── api.ts                       # openapi-fetch client
│   └── utils.ts                     # Utilities
└── App.vue
```

### Packages

#### `packages/worker/src/` — Background Workers

```
src/
├── index.ts                         # AI tasks worker entry (queue: ai-tasks, concurrency: 5)
├── studio-worker.ts                 # Studio worker entry (queue: studio-tasks, concurrency: 3)
├── types.ts                         # AITaskJobData, WorkerContext, ToolWorker, StepResult
├── tools/
│   ├── index.ts                     # Tool worker registry (getToolWorker, getRegisteredTools)
│   ├── figme.ts                     # FigMe tool (2-step: image gen + 3D)
│   ├── background-remove.ts        # Background removal (fal.ai)
│   └── crystal-memory.ts           # Crystal memory pipeline (bg-remove + VGGT)
├── studio-tools/
│   ├── index.ts                     # Studio provider registry (getStudioProviderWorker)
│   ├── types.ts                     # StudioProvider, StudioGenerationJobData, StudioProviderWorker
│   ├── progress.ts                  # Studio SSE progress (Redis Streams + Pub/Sub)
│   ├── utils.ts                     # Studio utility functions
│   └── providers/
│       ├── openai-worker.ts         # OpenAI Responses API (chat-image, image-only)
│       ├── google-worker.ts         # Google Gemini (chat-image)
│       └── fal-worker.ts            # fal.ai utilities (background-remove, upscale)
└── lib/
    ├── credentials.ts               # AES-256-GCM credential decryption
    ├── progress.ts                  # User task progress publishing (Redis Pub/Sub)
    ├── provider-errors.ts           # Provider 429 detection + exponential backoff
    └── storage.ts                   # S3 upload utilities for workers
```

#### `packages/services/src/` — Shared Business Logic

```
src/
├── index.ts                         # Re-exports all services
├── credit.ts                        # Credit operations (reserve, confirm, release, add)
├── storage.ts                       # S3 operations (presigned URLs, CDN URLs, CRUD)
├── progress.ts                      # Progress event publishing (Redis Streams + Pub/Sub)
├── redis.ts                         # Redis connection singleton
├── logger.ts                        # Pino logger (createLogger, createRequestLogger, createTaskLogger)
├── metrics.ts                       # Prometheus metrics registry + all metric definitions
├── rate-limit-config.ts             # User rate limit config (tiers, limits) from DB/Redis
└── provider-rate-limiter.ts         # Per-provider rate limiting (concurrency semaphore, RPM, RPD)
```

#### `packages/database/src/` — Database Layer

```
src/
├── index.ts                         # Drizzle client + table exports
├── types/
│   └── provider-rate-limit.ts       # ProviderRateLimitConfig, ProviderConfig types
└── schema/
    ├── index.ts                     # Schema re-exports
    ├── users.ts                     # users, sessions, accounts, verifications
    ├── tools.ts                     # tools, tool_types
    ├── tasks.ts                     # tasks, task_payloads
    ├── credits.ts                   # credits, credit_transactions, credit_packages
    ├── assets.ts                    # assets
    ├── providers.ts                 # providers (web)
    ├── admin-providers.ts           # admin_providers (studio)
    ├── banners.ts                   # banners
    ├── studio.ts                    # studio_projects, studio_generations
    └── rate-limit-settings.ts       # rate_limit_settings
```

#### `packages/auth/src/` — Authentication

```
src/
├── index.ts                         # Re-exports
├── server.ts                        # better-auth server config (email/password + social OAuth)
├── client.ts                        # better-auth client factory (createClient)
└── permissions.ts                   # Permission/role utilities
```

#### `packages/shared/src/` — Shared Utilities

```
src/
├── index.ts                         # Re-exports
├── api/
│   ├── index.ts                     # API client utilities
│   └── types.ts                     # Auto-generated OpenAPI TypeScript types
├── schemas/                         # Shared Zod schemas
│   ├── index.ts
│   ├── common.ts                    # Shared schema primitives
│   ├── auth.schemas.ts
│   ├── task.schemas.ts
│   ├── tool.schemas.ts
│   ├── tool-type.schemas.ts
│   ├── provider.schemas.ts
│   ├── package.schemas.ts
│   ├── banner.schemas.ts
│   └── health.schemas.ts
├── errors/                          # Error handling
│   ├── index.ts
│   ├── app-error.ts                 # AppError class
│   └── codes.ts                     # ERROR_CODES enum
├── tool-registry/                   # Tool metadata registry
│   ├── index.ts
│   ├── types.ts
│   ├── figme.ts
│   ├── background-remove.ts
│   └── crystal-memory.ts
├── config/                          # Shared configuration
│   ├── index.ts
│   ├── locales.ts
│   └── storage.ts
└── types/
    └── index.ts                     # Shared TypeScript types
```

---

## Adding a New Tool

### Step 1: Design Tool Configuration

Define the tool's step pipeline. Each step specifies a provider and cost:

```json
{
  "steps": [
    {
      "id": "step-id",
      "name": "Step Display Name",
      "type": "step-type",
      "providerId": "<uuid>",
      "providerModel": "model-name",
      "cost": 10
    }
  ],
  "maxFileSize": 10485760,
  "supportedFormats": ["jpg", "png", "webp"]
}
```

### Step 2: Create Provider (Admin UI)

1. Go to Admin → Providers → Add Provider
2. Fill in: Name, Display Name, Type, API Key, Base URL
3. (Optional) Set `config.rateLimit` to control throughput:
   ```json
   { "rateLimit": { "maxConcurrency": 5, "maxPerMinute": 100, "maxPerDay": 10000 } }
   ```

### Step 3: Create Tool Type (Admin UI)

Go to Admin → Tool Types → Add Type. Fill in: Name (slug), Display Name, Icon, Color.

### Step 4: Create Tool Record (Admin UI)

Go to Admin → Tools → Add Tool. Fill in: Slug, Title, Description, Tool Type, Config JSON, Credits Cost.

### Step 5: Implement ToolWorker

Create `packages/worker/src/tools/my-new-tool.ts`:

```typescript
import type { ToolWorker, WorkerContext, StepResult } from '../types';

export const myNewToolWorker: ToolWorker = {
  async execute(ctx: WorkerContext): Promise<StepResult> {
    const { taskId, input, redis } = ctx;

    // 1. Get provider credentials (if needed)
    // 2. Call provider API
    // 3. Upload results to S3
    // 4. Return result

    return {
      success: true,
      output: { /* result data */ },
    };
  },
};
```

### Step 6: Register in Tool Registry

Add to `packages/worker/src/tools/index.ts`:

```typescript
import { myNewToolWorker } from './my-new-tool';

const toolWorkers: Record<string, ToolWorker> = {
  // ... existing tools
  'my-new-tool': myNewToolWorker,
};
```

### Step 7: Create Vue View

Create `apps/funmagic-web-vue3/src/views/tools/MyNewToolView.vue` and add a route in `router/index.ts`:

```typescript
{
  path: '/tools/my-new-tool',
  name: 'tool-my-new-tool',
  component: () => import('@/views/tools/MyNewToolView.vue'),
  meta: { requiresAuth: true }
}
```

### Step 8: Regenerate API Types

```bash
bun run dev:backend      # Start backend first
bun run api:generate     # Generate types from OpenAPI spec
```

### Step 9: Test

1. Create the tool via Admin UI (keep inactive initially)
2. Navigate to `/tools/my-new-tool`
3. Verify: task creation → progress SSE → result display → credit flow

---

## Adding a Studio Provider

### Step 1: Create StudioProviderWorker

Create `packages/worker/src/studio-tools/providers/my-provider-worker.ts`:

```typescript
import type { StudioProviderWorker, StudioWorkerContext, StudioResult } from '../types';
import { createStudioProgressTracker } from '../progress';

export const myProviderWorker: StudioProviderWorker = {
  provider: 'my-provider',
  capabilities: ['chat-image'],

  async execute(ctx: StudioWorkerContext): Promise<StudioResult> {
    const { messageId, input, redis, apiKey } = ctx;
    const progress = createStudioProgressTracker(redis, messageId);

    // 1. Call provider API
    // 2. Stream progress (text deltas, images)
    await progress.textDelta('Generating...');
    // 3. Upload results to S3
    await progress.complete(images, text);

    return { success: true, images, text };
  },
};
```

### Step 2: Register Provider

Add to `packages/worker/src/studio-tools/index.ts`.

### Step 3: Configure Admin Provider

Create an `admin_providers` record via Admin → Admin Providers with the provider's API key and optional rate limit config.

---

## Common Development Tasks

### Adding a Database Table

1. Create schema in `packages/database/src/schema/my-table.ts`
2. Export from `packages/database/src/schema/index.ts`
3. Export from `packages/database/src/index.ts`
4. Generate migration: `bun run db:generate`
5. Apply migration: `bun run db:migrate`

### Adding an API Endpoint

1. Create route in `apps/funmagic-backend/src/routes/`
2. Mount in `apps/funmagic-backend/src/index.ts`
3. Regenerate types: `bun run api:generate`

### Adding a UI Component

Use Naive UI components. Do not modify `src/components/ui/*.tsx` — apply styling overrides via `className` at usage time.

### Adding Environment Variables

1. Add to `.env.example` with documentation
2. Add to `.env` (local)
3. Add to `docker/docker-compose.infra.yml` or `deploy/docker-compose.prod.yml` as needed
4. If backend: add to `BACKEND_REQUIRED_ENV` in `apps/funmagic-backend/src/lib/env.ts`
5. If worker: add to `WORKER_REQUIRED_ENV` in `packages/worker/src/index.ts` or `studio-worker.ts`

---

## Environment Variables Reference

All variables from `.env.example`, grouped by category:

### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |

### Redis

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_URL` | Yes | — | Redis connection string |

### S3 / Object Storage

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `S3_ENDPOINT` | Yes | — | S3/MinIO endpoint URL |
| `S3_REGION` | No | `us-east-2` | AWS region |
| `S3_ACCESS_KEY` | Yes | — | S3 access key |
| `S3_SECRET_KEY` | Yes | — | S3 secret key |
| `S3_BUCKET_PUBLIC` | Yes | `funmagic-public` | Public assets bucket |
| `S3_BUCKET_PRIVATE` | Yes | `funmagic-private` | Private assets bucket |
| `S3_BUCKET_ADMIN` | Yes | `funmagic-admin` | Admin assets bucket |

### CDN (Production)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CDN_BASE_URL` | No | — | Public CDN base URL |
| `PRIVATE_CDN_BASE_URL` | No | — | Private CDN base URL |
| `CLOUDFRONT_KEY_PAIR_ID` | No | — | CloudFront key pair ID |
| `CLOUDFRONT_PRIVATE_KEY` | No | — | CloudFront private key (base64) |

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `8000` | Backend server port |

### Security

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SECRET_KEY` | Yes | — | AES-256-GCM encryption key (generate: `openssl rand -base64 32`) |

### Authentication (better-auth)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BETTER_AUTH_SECRET` | Yes | — | Auth signing secret (generate: `openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Yes | — | Auth base URL (e.g., `http://localhost:8000`) |

### CORS & Origins

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CORS_ORIGINS` | Yes | — | Comma-separated allowed origins |
| `TRUSTED_ORIGINS` | Yes | — | Comma-separated trusted origins for auth |

### Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | Yes | — | Backend API URL for frontend |

### OAuth Social Login

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | — | Google OAuth client secret |
| `FACEBOOK_CLIENT_ID` | No | — | Facebook OAuth client ID |
| `FACEBOOK_CLIENT_SECRET` | No | — | Facebook OAuth client secret |
| `APPLE_CLIENT_ID` | No | — | Apple Sign In client ID (requires HTTPS) |
| `APPLE_CLIENT_SECRET` | No | — | Apple Sign In client secret |

### Observability & Metrics

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `METRICS_AUTH_TOKEN` | No | — | Bearer token for /metrics endpoints |
| `WORKER_METRICS_PORT` | No | `9090` | AI tasks worker metrics port |
| `STUDIO_WORKER_METRICS_PORT` | No | `9091` | Studio worker metrics port |
| `LOG_LEVEL` | No | `info` | Pino log level (trace/debug/info/warn/error/fatal) |

### Grafana Cloud (Alloy Sidecar)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GRAFANA_LOKI_URL` | No | — | Grafana Cloud Loki push endpoint |
| `GRAFANA_LOKI_USERNAME` | No | — | Loki username |
| `GRAFANA_LOKI_API_KEY` | No | — | Loki API key |
| `GRAFANA_PROMETHEUS_URL` | No | — | Grafana Cloud Prometheus remote write endpoint |
| `GRAFANA_PROMETHEUS_USERNAME` | No | — | Prometheus username |
| `GRAFANA_PROMETHEUS_API_KEY` | No | — | Prometheus API key |

### Timeouts & Limits

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HEALTH_CHECK_TIMEOUT_MS` | No | `10000` | Provider health check timeout |
| `JOB_BACKOFF_DELAY_MS` | No | `1000` | Failed job retry backoff |
| `PRESIGNED_URL_EXPIRATION_PRIVATE` | No | `900` | Private asset URL TTL (seconds) |
| `PRESIGNED_URL_EXPIRATION_UPLOAD` | No | `3600` | Upload URL TTL (seconds) |
| `ALLOWED_UPLOAD_TYPES` | No | `image/jpeg,...` | Comma-separated allowed MIME types |
| `MAX_IMAGE_UPLOAD_SIZE` | No | `20971520` | Max image upload size (bytes, 20MB) |
| `MAX_FILE_UPLOAD_SIZE` | No | `52428800` | Max file upload size (bytes, 50MB) |
| `MAX_STYLE_IMAGES` | No | `8` | Max style reference images per tool |

---

## Troubleshooting

### Common Issues

**"No worker found for tool: xxx"**
- Ensure the tool slug matches a key in `packages/worker/src/tools/index.ts`
- Verify the tool record exists in the database and `isActive` is true

**"Provider not found"**
- Verify `providerId` in tool config matches a provider UUID in the database
- Check `packages/database/src/schema/providers.ts` for table structure

**Worker not processing jobs**
- Check Redis connection: `bun run infra:logs`
- Verify worker is running: `bun run dev:worker`
- Check BullMQ queue: `bun run db:studio` → inspect tasks table

**SSE not working**
- Check Redis pub/sub is functioning
- Verify task ID matches between backend and worker
- Check browser DevTools Network tab for SSE connection status

**Vue app build errors**
- Clear Vite cache: `rm -rf node_modules/.vite`
- Rebuild: `bun install && bun run build`

**CORS issues in development**
- Ensure `CORS_ORIGINS` includes `http://localhost:3002,http://localhost:3003`

### Provider 429 Errors

Provider 429 (rate limit) errors are auto-retried via `DelayedError`:
- Jobs are rescheduled with exponential backoff (1s, 2s, 4s... capped at 60s), up to 3 retries
- They are **not** counted as task failures
- To tune: set `config.rateLimit` on the provider record with `maxConcurrency`, `maxPerMinute`, `maxPerDay`
- To disable auto-retry: set `config.rateLimit.retryOn429: false`
- Detection logic: `packages/worker/src/lib/provider-errors.ts`

### User Rate Limit 429 Errors

If a user receives 429 from the platform:
- Check their tier: query `credits.lifetimePurchased` to determine multiplier
- View current config: `GET /api/admin/settings` (admin only)
- Adjust limits: `PUT /api/admin/settings` with updated tiers/limits
- The user's tier cache refreshes every 5 minutes (or on credit purchase)

### Metrics Debugging

```bash
# Check backend metrics
curl http://localhost:8000/metrics

# Check worker metrics
curl http://localhost:9090/metrics

# Check studio worker metrics
curl http://localhost:9091/metrics

# If METRICS_AUTH_TOKEN is set
curl -H "Authorization: Bearer <token>" http://localhost:8000/metrics
```

### Studio Worker Not Running

- The studio worker is **not** started by `bun run dev` — run it separately:
  ```bash
  bun run dev:worker:studio
  ```
- Verify required env vars: `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`
- Check logs for provider registration: `Registered providers: [openai, google, fal]`

### Logs

```bash
bun run dev                                  # All services (interleaved output)
bun run dev:backend 2>&1 | tee backend.log   # Backend with log file
bun run dev:worker 2>&1 | tee worker.log     # Worker with log file

# In production (Docker Compose)
docker compose -f deploy/docker-compose.prod.yml logs -f backend
docker compose -f deploy/docker-compose.prod.yml logs -f worker
docker compose -f deploy/docker-compose.prod.yml logs -f admin-worker
```
