# FunMagic AI - System Design

## Overview

FunMagic AI is a multi-tenant AI tools platform that enables users to process images, generate 3D models, and perform various AI-powered transformations. The system is designed for scalability, extensibility, and real-time feedback.

## Architecture Diagram

```
                                   +-------------------------------------------------------------+
                                   |                         CDN (CloudFront)                    |
                                   |                    Static Assets + Public Files             |
                                   +-------------------------------------------------------------+
                                                              |
                     +----------------------------------------+----------------------------------------+
                     |                                        |                                        |
                     v                                        v                                        v
            +-----------------+                    +-----------------+                    +-----------------+
            |funmagic-web-vue3|                    |funmagic-admin   |                    |     Backend     |
            |   (Vue 3 SPA)   |                    |    -vue3        |                    |   (Hono + Bun)  |
            |    Port 3002    |                    |   (Vue 3 SPA)   |                    |    Port 8000    |
            +--------+--------+                    |    Port 3003    |                    +--------+--------+
                     |                             +--------+--------+                             |
                     |            REST API + SSE            |                                      |
                     +--------------------------------------+--------------------------------------+
                                                            |
                     +--------------------------------------+--------------------------------------+
                     |                                                                             |
                     v                                                                             v
            +-----------------+                                                          +-----------------+
            |    PostgreSQL   |<-------------------------------------------------------------+      Redis      |
            |    (Primary DB) |                                                          |  (Cache + Queue)|
            |    Port 5432    |                                                          |    Port 6379    |
            +-----------------+                                                          +--------+--------+
                                                                                                  |
                                                                                                  | BullMQ
                                                                                                  v
                                                                                         +-----------------+
                                                                                         |     Worker      |
                                                                                         |  (BullMQ + Bun) |
                                                                                         +--------+--------+
                                                                                                  |
                          +-------------------------------------------+---------------------------+
                          |                                   |                                   |
                          v                                   v                                   v
                 +-----------------+               +-----------------+               +-----------------+
                 |     OpenAI      |               |     fal.ai      |               |      Tripo      |
                 | (Image Gen)     |               | (Background RM) |               |   (3D Models)   |
                 +-----------------+               +-----------------+               +-----------------+

                                                            |
                                                            v
                                                   +-----------------+
                                                   |   MinIO / S3    |
                                                   |  (Asset Storage)|
                                                   |  Port 9000/9001 |
                                                   +-----------------+
```

## Tech Stack

### Frontend

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Vue 3 (Composition API) | Reactive UI framework |
| Runtime | Bun | Fast package management and runtime |
| UI Library | Naive UI | Enterprise-grade Vue 3 component library |
| Styling | UnoCSS / Tailwind CSS | Utility-first CSS |
| State | Pinia + TanStack Vue Query | State management + server state |
| Forms | Native Vue reactivity | Type-safe form handling |
| Auth Client | better-auth/client | Session management |
| Routing | Vue Router | Client-side routing |
| i18n | vue-i18n | Internationalization |
| API Client | openapi-fetch | Type-safe API calls from OpenAPI spec |

### Backend

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Hono | Fast, lightweight web framework |
| Runtime | Bun | High-performance JavaScript runtime |
| Validation | Zod + OpenAPI | Schema validation + API docs |
| ORM | Drizzle | Type-safe database queries |
| Auth | better-auth | Authentication + RBAC |
| Queue | BullMQ | Job queue for async tasks |

### Infrastructure

| Service | Technology | Purpose |
|---------|------------|---------|
| Database | PostgreSQL 18 | Primary data store |
| Cache | Redis 7.4 | Caching, sessions, job queue |
| Storage | MinIO (S3-compatible) | Asset storage |
| CDN | CloudFront (prod) | Static asset delivery |
| Containers | Docker Compose | Local development orchestration |

## Build & Runtime Strategy

### Overview

This project uses Bun as both the package manager and primary runtime, with Vite for frontend builds.

| Environment | Command | Runtime | Build Tool |
|-------------|---------|---------|------------|
| Development | `bun run dev` | Bun + Vite dev server | Vite HMR |
| Build | `bun run build` | Bun | Vite |
| Docker Production | `bun <service>` / nginx | Bun (backend) / nginx (SPAs) | N/A |

### Docker Strategy

Frontend SPAs are built with Vite and served via nginx. Backend and worker run directly on Bun.

## Core Components

### 1. Monorepo Structure

```
funmagic-ai/
├── apps/
│   ├── funmagic-web-vue3/     # Public-facing Vue 3 SPA
│   ├── funmagic-admin-vue3/   # Admin dashboard Vue 3 SPA
│   └── funmagic-backend/      # Hono API server
├── packages/
│   ├── database/              # Drizzle schema + migrations
│   ├── auth/                  # Shared auth configuration
│   ├── shared/                # API types, utilities
│   ├── services/              # Business logic (credits, storage, progress)
│   └── worker/                # BullMQ worker + tool implementations
└── docker/                    # Docker Compose files
```

### 2. Database Schema

The database contains tables organized into five domains: Auth, Tools, Tasks, Commerce, Admin AI Studio, and Content.

#### Auth Domain (better-auth)

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `users` | User accounts | `id`, `email`, `name`, `role` (user/admin/super_admin), `emailVerified`, `image`, `createdAt`, `updatedAt` |
| `sessions` | Active user sessions | `id`, `userId` (FK->users), `token`, `expiresAt`, `ipAddress`, `userAgent` |
| `accounts` | OAuth/social accounts | `id`, `userId` (FK->users), `providerId` (google/github), `accountId`, `accessToken`, `refreshToken` |
| `verifications` | Email verification tokens | `id`, `identifier`, `value`, `expiresAt`, `createdAt` |

#### Tools Domain

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `tool_types` | Tool categories | `id`, `name` (unique slug), `displayName`, `icon`, `color`, `description` |
| `tools` | AI tools configuration | `id`, `slug` (unique), `title`, `toolTypeId` (FK->tool_types), `config` (JSONB steps), `creditsCost`, `isActive` |
| `providers` | AI provider credentials | `id`, `name`, `type` (enum), `apiKey` (encrypted), `baseUrl`, `isHealthy`, `healthCheckedAt`, `config` (JSONB, supports `rateLimit` settings) |

#### Tasks Domain

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `tasks` | User task records | `id`, `userId` (FK->users), `toolId` (FK->tools), `status` (pending/running/completed/failed), `creditsCost`, `parentTaskId` (FK->tasks), `currentStepId` |
| `task_payloads` | Task input/output data | `id`, `taskId` (FK->tasks), `input` (JSONB), `output` (JSONB), `error` (text) |
| `assets` | Stored files/outputs | `id`, `userId` (FK->users), `bucket`, `storageKey`, `visibility` (public/private/admin-private), `module`, `mimeType`, `size` |

#### Commerce Domain

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `credits` | User credit balance | `id`, `userId` (FK->users, unique), `balance`, `reservedBalance`, `lifetimeEarned`, `lifetimeSpent` |
| `credit_transactions` | Credit history | `id`, `userId` (FK->users), `type` (purchase/spend/refund/bonus/admin_adjust), `amount`, `balanceAfter`, `referenceId`, `description` |
| `credit_packages` | Purchasable packages | `id`, `name`, `credits`, `price`, `currency`, `stripePriceId`, `isActive`, `sortOrder` |

#### Admin AI Studio Domain

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `admin_chats` | Admin AI chat sessions | `id`, `adminId` (FK->users), `title`, `openaiResponseId`, `model`, `systemPrompt` |
| `admin_messages` | Chat messages with task tracking | `id`, `chatId` (FK->admin_chats), `role`, `content`, `quotedImageIds`, `provider`, `model`, `images` (JSONB), `input` (JSONB), `status`, `bullmqJobId` |

#### Content Domain

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `banners` | Promotional content | `id`, `title`, `description`, `thumbnail`, `link`, `linkText`, `linkTarget`, `type` (main/side), `position`, `badge`, `badgeColor`, `isActive`, `startsAt`, `endsAt` |

#### Relationships Summary

```
users ---------+--- sessions (1:N)
               +--- accounts (1:N)
               +--- tasks (1:N)
               +--- credits (1:1)
               +--- credit_transactions (1:N)
               +--- assets (1:N)
               +--- admin_chats (1:N)

admin_chats ---- admin_messages (1:N)

tool_types ---- tools (1:N)

tasks ---------+--- task_payloads (1:1)
               +--- tasks (self-ref: parentTaskId)
```

### 3. Authentication Flow

```
+----------+     +----------+     +----------+
| Vue SPA  |     | Backend  |     | Database |
+----+-----+     +----+-----+     +----+-----+
     |                |                |
     |  Login Form    |                |
     |--------------->|                |
     | POST /api/auth |                |
     |--------------->|                |
     |                |  Verify creds  |
     |                |--------------->|
     |                |<---------------|
     |  Set Cookie    |                |
     |<---------------|                |
     |  Store session |                |
     |  in Pinia      |                |
     |                |                |

Session stored in:
- HTTP-only cookie (secure, SameSite)
- Redis for session data
- Pinia store for client state
```

### 4. Task Processing Flow

```
+----------+     +----------+     +----------+     +----------+     +------------+     +----------+
|  Client  |     | Backend  |     |  Redis   |     |  Worker  |     | Rate Limit |     | Provider |
+----+-----+     +----+-----+     +----+-----+     +----+-----+     +-----+------+     +----+-----+
     |                |                |                |                   |                |
     | POST /tasks    |                |                |                   |                |
     |--------------->|                |                |                   |                |
     |                | Reserve credits|                |                   |                |
     |                |----------------|                |                   |                |
     |                | Add job        |                |                   |                |
     |                |--------------->|                |                   |                |
     | { taskId }     |                |                |                   |                |
     |<---------------|                |                |                   |                |
     |                |                |                |                   |                |
     | SSE /stream    |                |                |                   |                |
     |--------------->|                |                |                   |                |
     |                | Subscribe      |                |                   |                |
     |                |--------------->|  Pick job      |                   |                |
     |                |                |<---------------|                   |                |
     |                |                |                | tryAcquire()      |                |
     |                |                |                |------------------>|                |
     |                |                |                |                   |                |
     |                |                |                |   (if denied)     |                |
     |                |                |                |  moveToDelayed    |                |
     |                |                |                |  + DelayedError   |                |
     |                |                |                |                   |                |
     |                |                |                |   (if allowed)    |                |
     |                |                |                |------------------------------------->
     |                |                |  Progress      |                   |                |
     |                |<---------------|<---------------|                   |                |
     | SSE: progress  |                |                |<-------------------------------------|
     |<---------------|                |                |                   |                |
     |                |                |                | releaseSlot()     |                |
     |                |                |                |------------------>|                |
     |                |                |  Complete      |                   |                |
     |                |<---------------|<---------------|                   |                |
     | SSE: complete  |                |                |                   |                |
     |<---------------|                |                |                   |                |
```

## Storage Architecture

### S3/MinIO Bucket Structure

Three buckets with visibility-based routing:

```
funmagic-public/                              # CDN-backed public bucket
  shared/{userId}/{assetId}/{filename}        # Published assets (public URLs)

funmagic-private/                             # Private bucket (presigned URLs only)
  {userId}/{module}/{timestamp}_{filename}    # User uploads & AI outputs

funmagic-admin/                               # Admin-only bucket
  {key}                                       # System assets, banners, etc.
```

### Visibility -> Bucket Mapping

| Visibility | Bucket | Access Method |
|------------|--------|---------------|
| `'public'` | `funmagic-public` (S3_BUCKET_PUBLIC) | Direct CDN URL |
| `'private'` | `funmagic-private` (S3_BUCKET_PRIVATE) | Presigned URL (time-limited) |
| `'admin-private'` | `funmagic-admin` (S3_BUCKET_ADMIN) | Admin presigned URL only |

### Storage Key Pattern

```
{userId}/{module}/{timestamp}_{filename}

Example: usr_abc123/image-gen/1706745600000_output.png
```

- `userId`: Owner identifier
- `module`: Tool/feature namespace (e.g., `image-gen`, `3d-gen`, `avatar`)
- `timestamp`: Unix milliseconds for uniqueness
- `filename`: Original or generated filename

### CDN Configuration

- **Public bucket**: Served via CloudFront at `CDN_URL`
- **Private/Admin buckets**: No CDN, presigned URLs only
- **Cache headers**: `max-age=31536000` for immutable assets

### Presigned URL Flow

```
1. Client requests upload URL -> Backend generates presigned PUT URL
2. Client uploads directly to S3 -> Bypasses backend for large files
3. Client confirms upload -> Backend creates asset record with visibility
4. For downloads:
   - Public: Return CDN URL directly
   - Private: Generate presigned GET URL (TTL: 1 hour default)
```

## Credit System

### Credit Flow

```
+------------------------------------------------------------+
|                         Credit Lifecycle                      |
+------------------------------------------------------------+
|                                                               |
|  Purchase --> Balance --> Reserved --> Spent                  |
|                  ^            |                               |
|                  |            | (on failure)                  |
|                  +------------+                               |
|                     Released                                  |
+------------------------------------------------------------+
```

### Transaction Types

| Type | Description |
|------|-------------|
| `purchase` | Credits bought by user |
| `spend` | Credits consumed by task |
| `refund` | Credits returned (task failed) |
| `bonus` | Promotional credits |
| `admin_adjust` | Manual adjustment by admin |

## Real-time Progress (SSE)

### Event Types

```typescript
type ProgressEvent =
  | { type: 'connected' }
  | { type: 'step_started', stepId: string, stepName: string }
  | { type: 'progress', progress: number, message: string }
  | { type: 'step_completed', stepId: string, output: object }
  | { type: 'completed', output: object }
  | { type: 'failed', error: string };
```

### Redis Pub/Sub Channels

```
task:{taskId}:events    # Progress updates for specific task
task:{taskId}:output    # Final output storage
```

## Per-Provider Rate Limiting

The platform implements per-provider rate limiting at the worker level, controlling concurrency, requests-per-minute (RPM), and requests-per-day (RPD) for each AI provider independently.

### Architecture

Two separate scopes ensure web user tools and admin studio tasks are rate-limited independently:

| Scope | Redis Prefix | Config Source | Used By |
|-------|-------------|---------------|---------|
| `web` | `prl:web:{providerName}:*` | `providers.config` | AI tasks worker |
| `admin` | `prl:admin:{providerName}:*` | `admin_providers.config` | Studio worker |

### Redis Key Layout

| Key | Type | Purpose |
|-----|------|---------|
| `prl:{scope}:{provider}:config` | String (JSON) | Cached config (5 min TTL) |
| `prl:{scope}:{provider}:sem` | Sorted Set | Concurrency semaphore |
| `prl:{scope}:{provider}:rpm` | Counter | RPM counter (60s TTL) |
| `prl:{scope}:{provider}:rpd:{YYYY-MM-DD}` | Counter | RPD counter (86400s TTL) |

### Config Shape

Rate limit settings live inside the existing `config` jsonb field on both `providers` and `admin_providers` tables:

```json
{
  "config": {
    "rateLimit": {
      "maxConcurrency": 5,
      "maxPerMinute": 100,
      "maxPerDay": 10000,
      "retryOn429": true,
      "maxRetries": 3,
      "baseBackoffMs": 1000
    }
  }
}
```

All fields are optional. No database migration is needed — the `config` jsonb column already exists.

### Processing Flow

```
Worker picks job → [Provider Rate Limiter] → allowed → Provider API → releaseSlot()
                                           → denied  → moveToDelayed (re-queued via DelayedError)
```

### Graceful Degradation

- **No config** = no rate limiting (provider runs without restrictions)
- **429 auto-retry** is always active when `retryOn429` is enabled (default: `true`)
- Jobs denied by the rate limiter are re-queued via `DelayedError`, not counted as failures
- Exponential backoff on 429: 1s, 2s, 4s... capped at 60s

### New Files

| File | Purpose |
|------|---------|
| `packages/database/src/types/provider-rate-limit.ts` | TypeScript interfaces for `config.rateLimit` |
| `packages/services/src/provider-rate-limiter.ts` | Redis-based rate limiter service (acquire/release/config loading) |
| `packages/worker/src/lib/provider-errors.ts` | Provider 429 detection and exponential backoff calculation |

## Multi-Step Tool Architecture

### Tool Configuration Schema

```json
{
  "steps": [
    {
      "id": "image-gen",
      "name": "Image Generation",
      "type": "image-gen",
      "providerId": "uuid-openai",
      "providerModel": "gpt-image-1.5",
      "cost": 20
    },
    {
      "id": "3d-gen",
      "name": "3D Generation",
      "type": "3d-gen",
      "providerId": "uuid-tripo",
      "providerModel": "tripo-v2",
      "cost": 30
    }
  ],
  "styleReferences": [
    {
      "id": "style-anime",
      "name": "Anime",
      "imageUrl": "https://cdn.../preview.jpg",
      "prompt": "Transform into anime style"
    }
  ]
}
```

### Step Execution

1. Task created with `stepId` (optional) and `parentTaskId` (for chained steps)
2. Worker looks up step configuration from `tool.config`
3. Worker gets provider credentials (decrypted)
4. Worker executes step, publishes progress via Redis
5. Output stored in `task_payloads.output`
6. Credits confirmed on success, released on failure

## Tool Page Architecture

### Vue 3 View Structure

Each tool has a dedicated view with composables for logic:

```
src/views/tools/
├── FigmeView.vue                # FigMe tool view
├── BackgroundRemoveView.vue     # Background removal view
├── CrystalMemoryView.vue        # Crystal memory view
src/composables/
├── useFileUpload.ts             # S3 upload composable
├── useTaskProgress.ts           # SSE progress composable
src/components/tools/
├── PointCloudViewer.vue         # 3D point cloud viewer
├── BeforeAfterSlider.vue        # Image comparison
```

### Tool View Pattern

```vue
<script setup lang="ts">
import { useQuery, useMutation } from '@tanstack/vue-query'
import { api } from '@/lib/api'

const route = useRoute()
const { data: tool, isLoading } = useQuery({
  queryKey: ['tool', route.params.slug],
  queryFn: () => api.GET('/api/tools/{slug}', {
    params: { path: { slug: route.params.slug as string } }
  })
})
</script>
```

## Security

### Authentication

- **Method**: Cookie-based sessions with better-auth
- **Session Storage**: Redis with TTL
- **RBAC Roles**: `user`, `admin`, `super_admin`

### API Security

- All `/api/*` routes require authentication (except public endpoints)
- Admin routes check `role === 'admin' || role === 'super_admin'`
- CORS configured for frontend origins
- Per-provider rate limiting via Redis (concurrency, RPM, RPD) — see [Per-Provider Rate Limiting](#per-provider-rate-limiting)

### Secrets Management

- Provider API keys encrypted at rest (AES-256)
- Environment variables for infrastructure secrets
- No secrets in client bundles

### Asset Security

- Private assets: Presigned URLs with short TTL
- Public assets: Served via CDN with cache headers
- User isolation: Assets scoped by `user_id`

## Scalability Considerations

### Horizontal Scaling

| Component | Scaling Strategy |
|-----------|------------------|
| Vue 3 SPAs | Static files via CDN, infinitely scalable |
| Backend | Stateless, scale via replicas |
| Worker | Scale based on queue depth |
| PostgreSQL | Read replicas, connection pooling |
| Redis | Redis Cluster for high availability |

### Performance Optimizations

- **CDN**: Static assets and public files cached at edge
- **Database**: Indexes on frequently queried columns
- **Caching**: Redis for session, hot data, rate limits
- **Async Processing**: All AI operations via BullMQ queue
- **Code Splitting**: Vue Router lazy loading for routes
- **Tree Shaking**: Vite removes unused code

## Production Deployment

### Environment Variables

```bash
# Database
DATABASE_URL=postgres://...

# Redis
REDIS_URL=redis://...

# S3 (AWS or compatible)
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET_PUBLIC=funmagic-public
S3_BUCKET_PRIVATE=funmagic-private
S3_BUCKET_ADMIN=funmagic-admin
S3_REGION=us-east-1

# CDN (public bucket only)
CDN_URL=https://cdn.funmagic.ai

# Auth
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://funmagic.ai

# API URLs
VITE_API_URL=https://api.funmagic.ai
```

### Health Checks

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Basic liveness check |
| `GET /health/db` | Database connectivity |
| `GET /health/redis` | Redis connectivity |
| `GET /health/all` | All services status |

## Monitoring (Planned)

- **Metrics**: Prometheus + Grafana
- **Logging**: Structured JSON logs -> aggregator
- **Tracing**: OpenTelemetry for distributed tracing
- **Alerts**: Based on error rates, queue depth, latency

---

## Design Decisions

### Migration to Vue 3 (2026-02)

The frontend has been completely migrated from Next.js to Vue 3, resulting in a cleaner separation of concerns between frontend SPAs and backend API.

| Component | Before | After |
|-----------|--------|-------|
| Framework | Next.js 16 (SSR) | Vue 3 (SPA) |
| Build Tool | Next.js (webpack) | Vite |
| UI Library | shadcn/ui | Naive UI |
| State | TanStack Query (React) | Pinia + TanStack Vue Query |
| Routing | Next.js App Router | Vue Router |
| I18n | next-intl | vue-i18n |

Key benefits:
1. Clear separation between frontend (SPAs) and backend (API)
2. Static SPAs can be served from CDN
3. Vite HMR is faster for development
4. Naive UI provides comprehensive Vue 3 component set
5. No SSR complexity (eliminates hydration issues)

### Auth Routes Centralized to Backend (2026-02-02)

Auth routes have been centralized to the backend. All authentication requests now go through `http://localhost:8000/api/auth/*`.

#### Cookie Considerations

- **Localhost**: Cookies work across ports (same domain)
- **Production** (different subdomains like `api.example.com` <-> `app.example.com`):
  ```typescript
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
  }
  ```
