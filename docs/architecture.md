# FunMagic AI - System Architecture

## Table of Contents

1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Tech Stack](#tech-stack)
4. [Monorepo Structure](#monorepo-structure)
5. [Database Schema](#database-schema)
6. [Authentication & Authorization](#authentication--authorization)
7. [Task Processing Pipeline](#task-processing-pipeline)
8. [Per-Provider Rate Limiting](#per-provider-rate-limiting)
9. [User Rate Limiting](#user-rate-limiting)
10. [Observability](#observability)
11. [Admin AI Studio](#admin-ai-studio)
12. [Storage Architecture](#storage-architecture)
13. [Credit System](#credit-system)
14. [Real-time Progress (SSE)](#real-time-progress-sse)
15. [Security](#security)
16. [Multi-Step Tool Architecture](#multi-step-tool-architecture)
17. [Production Deployment](#production-deployment)
18. [Scalability](#scalability)
19. [Design Decisions](#design-decisions)

---

## Overview

FunMagic AI is a multi-tenant AI tools platform that enables users to process images, generate 3D models, and perform various AI-powered transformations. Administrators use an integrated AI Studio for image generation and experimentation across multiple providers. The system is designed for extensibility (new tools/providers), real-time feedback (SSE), and production observability (structured logging, Prometheus metrics, Grafana dashboards).

---

## Architecture Diagram

```
                           ┌──────────────────────────────────────────────────────────────┐
                           │                     Cloudflare DNS                           │
                           │  funmagic.ai / admin.funmagic.ai / api.funmagic.ai          │
                           └──────────────────────────┬───────────────────────────────────┘
                                                      │
                                                      ▼
                           ┌──────────────────────────────────────────────────────────────┐
                           │                  nginx reverse proxy (:80/:443)              │
                           └────┬──────────────────────┬──────────────────────┬───────────┘
                                │                      │                      │
                                ▼                      ▼                      ▼
                      ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
                      │ funmagic-web-vue3│  │funmagic-admin-vue3│  │   Backend (Hono+Bun) │
                      │  Vue 3 SPA :3002 │  │  Vue 3 SPA :3003  │  │       :8000          │
                      └──────────────────┘  └──────────────────┘  │  /metrics (Prometheus)│
                                                                   └──────────┬───────────┘
                         Social OAuth ◄────────────────────────────────────────┤
                      (Google/Apple/Facebook)                                  │
                                                                               │
                   ┌───────────────────────────────────────────────────────────┼───────────┐
                   │                                                           │           │
                   ▼                                                           ▼           ▼
          ┌──────────────────┐                                      ┌──────────────┐ ┌──────────┐
          │    PostgreSQL 17 │                                      │  Redis 7.4   │ │ MinIO/S3 │
          │      :5432       │                                      │    :6379     │ │  :9000   │
          └──────────────────┘                                      └──────┬───────┘ └──────────┘
                                                                           │ BullMQ
                                                     ┌─────────────────────┴──────────────────┐
                                                     │                                        │
                                                     ▼                                        ▼
                                          ┌─────────────────────┐              ┌─────────────────────┐
                                          │   AI Tasks Worker   │              │  Studio Tasks Worker │
                                          │  queue: ai-tasks    │              │  queue: studio-tasks │
                                          │  concurrency: 5     │              │  concurrency: 3      │
                                          │  metrics :9090      │              │  metrics :9091       │
                                          └─────────┬───────────┘              └─────────┬───────────┘
                                                    │                                    │
                          ┌─────────────┬───────────┤                    ┌───────────────┼───────────┐
                          ▼             ▼           ▼                    ▼               ▼           ▼
                     ┌─────────┐  ┌──────────┐ ┌─────────┐       ┌──────────┐   ┌──────────┐ ┌──────────┐
                     │ OpenAI  │  │  fal.ai  │ │  Tripo  │       │  OpenAI  │   │  Google  │ │  fal.ai  │
                     │(images) │  │(bg-rm/up)│ │  (3D)   │       │(Resp.API)│   │ (Gemini) │ │(utility) │
                     └─────────┘  └──────────┘ └─────────┘       └──────────┘   └──────────┘ └──────────┘
                          │             │           │                  │               │           │
                          └─────────────┴───────────┘                 └───────────────┴───────────┘
                                        │                                             │
                                        ▼                                             ▼
                              ┌──────────────────┐                          ┌──────────────────┐
                              │   Replicate      │                          │  Grafana Alloy   │
                              │ (VGGT/3D vision) │                          │   (sidecar)      │
                              └──────────────────┘                          │  logs → Loki     │
                                                                            │  metrics → Prom  │
                                                                            └──────────────────┘
```

---

## Tech Stack

### Frontend

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Vue 3 (Composition API) | Reactive UI framework |
| Build Tool | Vite | Fast HMR and bundling |
| Runtime | Bun | Package management and runtime |
| UI Library | Naive UI | Enterprise-grade Vue 3 component library |
| Styling | UnoCSS / Tailwind CSS | Utility-first CSS |
| State | Pinia + TanStack Vue Query | Local state + server state management |
| Routing | Vue Router | Client-side routing |
| i18n | vue-i18n | Internationalization |
| API Client | openapi-fetch | Type-safe API calls from OpenAPI spec |
| Auth Client | better-auth/client | Session management with `inferAdditionalFields` |

### Backend

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Hono / OpenAPIHono | Fast, lightweight web framework with OpenAPI integration |
| Runtime | Bun | High-performance JavaScript runtime |
| Validation | Zod + @hono/zod-openapi | Schema validation + auto-generated API docs |
| ORM | Drizzle | Type-safe database queries |
| Auth | better-auth | Authentication + RBAC + social OAuth |
| Queue | BullMQ | Job queue for async task processing |
| Logging | Pino | Structured JSON logging |
| Metrics | prom-client | Prometheus metrics collection |

### Infrastructure

| Service | Technology | Purpose |
|---------|------------|---------|
| Database | PostgreSQL 17 | Primary data store |
| Cache/Queue | Redis 7.4 | Sessions, BullMQ, rate limiting, SSE pub/sub |
| Object Storage | MinIO (dev) / S3 (prod) | Asset storage (3 buckets) |
| Reverse Proxy | nginx 1.27 | SSL termination, routing |
| DNS & SSL | Cloudflare | DNS management, origin certificates |
| Observability | Grafana Alloy | Log and metrics collection to Grafana Cloud |
| Containers | Docker Compose | Orchestration (dev and prod) |

---

## Monorepo Structure

```
funmagic-ai/
├── apps/
│   ├── funmagic-web-vue3/        # Public-facing Vue 3 SPA (:3002)
│   ├── funmagic-admin-vue3/      # Admin dashboard Vue 3 SPA (:3003)
│   └── funmagic-backend/         # Hono API server (:8000)
├── packages/
│   ├── database/                 # Drizzle schema, migrations, types
│   ├── auth/                     # Shared better-auth configuration
│   ├── shared/                   # API types, Zod schemas, error codes, tool registry
│   ├── services/                 # Business logic (credits, storage, progress, logging, metrics, rate limiting)
│   └── worker/                   # BullMQ workers + tool implementations + studio providers
├── docker/                       # Local development Docker Compose files
├── deploy/                       # Production deployment (Docker Compose, nginx, setup scripts)
├── infra/                        # Observability infrastructure (Grafana Alloy)
└── docs/                         # Documentation
```

---

## Database Schema

The database uses PostgreSQL 17 with Drizzle ORM. Tables are organized into seven domains.

### Auth Domain (better-auth)

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `users` | User accounts | `id`, `email`, `name`, `role` (user/admin/super_admin), `emailVerified`, `image` |
| `sessions` | Active sessions | `id`, `userId`, `token`, `expiresAt`, `ipAddress`, `userAgent` |
| `accounts` | OAuth/social accounts | `id`, `userId`, `providerId` (google/apple/facebook), `accountId`, `accessToken`, `refreshToken` |
| `verifications` | Email verification tokens | `id`, `identifier`, `value`, `expiresAt` |

### Tools Domain

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `tool_types` | Tool categories | `id`, `name` (unique slug), `displayName`, `icon`, `color`, `description` |
| `tools` | AI tool configurations | `id`, `slug` (unique), `title`, `toolTypeId`, `config` (JSONB: steps, style refs), `creditsCost`, `isActive` |
| `providers` | Web AI provider credentials | `id`, `name`, `type`, `apiKey` (encrypted), `baseUrl`, `isHealthy`, `config` (JSONB, supports `rateLimit`) |
| `admin_providers` | Studio AI provider credentials | `id`, `name`, `type`, `apiKey` (encrypted), `baseUrl`, `config` (JSONB, supports `rateLimit`) |

### Tasks Domain

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `tasks` | User task records | `id`, `userId`, `toolId`, `status` (pending/processing/completed/failed), `creditsCost`, `parentTaskId`, `currentStepId` |
| `task_payloads` | Task input/output data | `id`, `taskId`, `input` (JSONB), `output` (JSONB), `error`, `providerRequest`, `providerResponse`, `providerMeta` |
| `assets` | Stored files/outputs | `id`, `userId`, `bucket`, `storageKey`, `visibility` (public/private/admin-private), `module`, `mimeType`, `size` |

### Commerce Domain

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `credits` | User credit balance | `id`, `userId` (unique), `balance`, `reservedBalance`, `lifetimeEarned`, `lifetimeSpent`, `lifetimePurchased` |
| `credit_transactions` | Credit history | `id`, `userId`, `type` (purchase/spend/refund/bonus/admin_adjust/reservation), `amount`, `balanceAfter`, `referenceId`, `description` |
| `credit_packages` | Purchasable packages | `id`, `name`, `credits`, `price`, `currency`, `stripePriceId`, `isActive`, `sortOrder` |

### Studio Domain

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `studio_projects` | Studio chat sessions | `id`, `adminId`, `title`, `openaiResponseId`, `model`, `systemPrompt` |
| `studio_generations` | Generation messages + results | `id`, `projectId`, `role`, `content`, `images` (JSONB), `input` (JSONB), `status`, `provider`, `model`, `rawRequest`, `rawResponse`, `error` |

### Settings Domain

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `rate_limit_settings` | Platform rate limit configuration | `id`, `tiers` (JSONB), `limits` (JSONB), `updatedAt` |

### Content Domain

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `banners` | Promotional content | `id`, `title`, `description`, `thumbnail`, `link`, `type` (main/side), `position`, `isActive`, `startsAt`, `endsAt` |

### Relationships

```
users ─────────┬─── sessions (1:N)
               ├─── accounts (1:N)           ← social OAuth providers
               ├─── tasks (1:N)
               ├─── credits (1:1)
               ├─── credit_transactions (1:N)
               ├─── assets (1:N)
               └─── studio_projects (1:N)    ← admin only

studio_projects ─── studio_generations (1:N)

tool_types ─── tools (1:N)

tasks ─────────┬─── task_payloads (1:1)
               └─── tasks (self-ref: parentTaskId)
```

---

## Authentication & Authorization

### Stack

- **Library**: better-auth with email/password + social OAuth
- **Social Providers**: Google, Apple, Facebook
- **Session Storage**: PostgreSQL (primary) + Redis (secondary, for fast lookups)
- **Client**: `better-auth/client` with `inferAdditionalFields` plugin

### RBAC Roles

| Role | Permissions |
|------|-------------|
| `user` | Public tools, assets, credits, profile |
| `admin` | All of user + tool management, providers, banners, AI Studio, tasks |
| `super_admin` | All of admin + user management, system settings, rate limit configuration |

### Session Flow

```
┌───────────┐     ┌────────────┐     ┌────────────┐     ┌───────┐
│  Vue SPA  │     │  Backend   │     │  Database   │     │ Redis │
└─────┬─────┘     └─────┬──────┘     └─────┬──────┘     └───┬───┘
      │                  │                   │                │
      │ Email/Password   │                   │                │
      │  — or —          │                   │                │
      │ Social OAuth     │                   │                │
      │ (redirect flow)  │                   │                │
      │─────────────────>│                   │                │
      │                  │ Verify/Create user│                │
      │                  │──────────────────>│                │
      │                  │<──────────────────│                │
      │                  │ Create session    │                │
      │                  │──────────────────>│                │
      │                  │ Cache in Redis    │                │
      │                  │───────────────────────────────────>│
      │  Set-Cookie      │                   │                │
      │<─────────────────│                   │                │
      │  (HTTP-only,     │                   │                │
      │   SameSite)      │                   │                │
```

### Cross-Subdomain Cookies (Production)

In production, `api.funmagic.ai`, `funmagic.ai`, and `admin.funmagic.ai` share cookies via:

```typescript
advanced: {
  crossSubDomainCookies: {
    enabled: true,
  },
}
```

---

## Task Processing Pipeline

### 7.1 Web User Tasks (ai-tasks queue)

User-facing AI tools (background removal, image generation, 3D modeling) are processed through the `ai-tasks` BullMQ queue with **concurrency 5**.

```
Client → POST /api/tasks → Backend reserves credits → Redis queue (ai-tasks) → Worker
         ↑                                                                        │
         │ SSE ← Redis Pub/Sub + Streams ← Progress events ←─────────────────────┘
```

**Worker**: `packages/worker/src/index.ts`
- Resolves provider name from tool config
- Applies per-provider rate limiting (tryAcquire/releaseSlot)
- Dispatches to tool-specific `ToolWorker.execute()`
- Confirms or releases credits based on outcome
- Records Prometheus metrics (task duration, count, provider API latency)

### 7.2 Admin Studio Tasks (studio-tasks queue)

Admin AI Studio generations are processed through the `studio-tasks` BullMQ queue with **concurrency 3**.

```
Admin → POST /api/admin/studio/generations → Backend → Redis queue (studio-tasks) → Studio Worker
         ↑                                                                              │
         │ SSE ← Redis Pub/Sub + Streams ← Studio progress events ←────────────────────┘
```

**Worker**: `packages/worker/src/studio-worker.ts`
- Dispatches to provider-specific `StudioProviderWorker.execute()`
- Supports streaming (text deltas, partial images, image completion)
- Manages multi-turn sessions (OpenAI Responses API, Google context reconstruction)
- Stores results in `studio_generations` with raw request/response data

### 7.3 Worker Processes and Metrics Ports

| Process | Entry Point | Queue | Concurrency | Metrics Port |
|---------|-------------|-------|-------------|--------------|
| AI Tasks Worker | `packages/worker/src/index.ts` | `ai-tasks` | 5 | `:9090` |
| Studio Worker | `packages/worker/src/studio-worker.ts` | `studio-tasks` | 3 | `:9091` |

Both workers run as separate Bun processes, each with their own Prometheus `/metrics` HTTP server.

---

## Per-Provider Rate Limiting

### Architecture

Two separate scopes ensure web user tools and admin studio tasks are rate-limited independently:

| Scope | Redis Prefix | Config Source | Used By |
|-------|-------------|---------------|---------|
| `web` | `prl:web:{provider}:*` | `providers.config.rateLimit` | AI tasks worker |
| `admin` | `prl:admin:{provider}:*` | `admin_providers.config.rateLimit` | Studio worker |

### Redis Key Layout

| Key | Type | Purpose |
|-----|------|---------|
| `prl:{scope}:{provider}:config` | String (JSON) | Cached config (5 min TTL) |
| `prl:{scope}:{provider}:sem` | Sorted Set | Concurrency semaphore (Lua-based) |
| `prl:{scope}:{provider}:rpm` | Counter | RPM counter (60s TTL) |
| `prl:{scope}:{provider}:rpd:{YYYY-MM-DD}` | Counter | RPD counter (86400s TTL) |

### Config Shape

Rate limit settings live inside the `config` JSONB field on both `providers` and `admin_providers` tables:

```json
{
  "rateLimit": {
    "maxConcurrency": 5,
    "maxPerMinute": 100,
    "maxPerDay": 10000,
    "retryOn429": true,
    "maxRetries": 3,
    "baseBackoffMs": 1000
  }
}
```

All fields are optional. No config means no rate limiting for that provider.

### Acquire/Release Flow

```
Worker picks job
  → tryAcquire(redis, scope, provider, jobId, config)
    → Check concurrency (Lua atomic ZADD if under limit)
    → Check RPM (INCR with 60s TTL)
    → Check RPD (INCR with 86400s TTL)
  → allowed: proceed to provider API → releaseSlot() in finally block
  → denied: moveToDelayed(retryAfterMs) → throw DelayedError (re-queued, not a failure)
```

### 429 Handling with Exponential Backoff

When a provider API returns HTTP 429:

1. `isProvider429Error()` detects the error from provider SDK exceptions
2. If `retryOn429` is enabled (default: `true`) and attempts < `maxRetries` (default: 3):
   - `calculateBackoff()` computes delay: `baseBackoffMs * 2^attempt`, capped at 60s
   - Job moved to delayed via `DelayedError` — not counted as a failure
3. After exhausting retries, the job fails normally

### Graceful Degradation

- **No config** = no rate limiting (provider runs unrestricted)
- Jobs denied by rate limiter are re-queued via `DelayedError`, not counted as failures
- Stale semaphore entries are auto-cleaned (entries older than 10 minutes)

**Source**: `packages/services/src/provider-rate-limiter.ts`, `packages/worker/src/lib/provider-errors.ts`

---

## User Rate Limiting

### 6-Tier Strategy

Six rate limit categories protect the platform at different layers:

| Category | Scope | Target | Default |
|----------|-------|--------|---------|
| `globalApi` | IP-based | All `/api/*` routes | High ceiling (bot/DDoS protection) |
| `userApi` | Per-user | Authenticated API routes | Per-user throughput cap |
| `taskCreation` | Per-user | `POST /api/tasks` | Strict per-user task submission |
| `upload` | IP-based | Asset upload endpoints | Upload frequency control |
| `authSession` | IP-based | `GET /api/auth/get-session` | Generous (multi-tab support) |
| `authAction` | IP-based | Sign-in / Sign-up endpoints | Strict (brute-force protection) |

### Tiered Multipliers

Rate limits scale based on lifetime credit purchases. Tiers are configured via the `rate_limit_settings` table:

```json
{
  "tiers": [
    { "name": "free",    "minPurchased": 0,    "multiplier": 1.0 },
    { "name": "basic",   "minPurchased": 100,  "multiplier": 1.5 },
    { "name": "premium", "minPurchased": 500,  "multiplier": 2.0 },
    { "name": "vip",     "minPurchased": 2000, "multiplier": 3.0 }
  ],
  "limits": {
    "globalApi":    { "max": 200 },
    "userApi":      { "max": 60  },
    "taskCreation": { "max": 10  },
    "upload":       { "max": 30  },
    "authSession":  { "max": 120 },
    "authAction":   { "max": 10  }
  }
}
```

For per-user categories (`userApi`, `taskCreation`), the effective limit is `base_max * tier_multiplier`. Tier is determined by querying the user's `credits.lifetimePurchased` (cached in Redis for 5 minutes).

### Admin Configuration

Admins can view and update rate limit settings via the settings API:

- `GET /api/admin/settings` — Read current tiers and limits
- `PUT /api/admin/settings` — Update tiers and limits (invalidates Redis cache)

**Source**: `apps/funmagic-backend/src/middleware/rate-limit.ts`, `packages/services/src/rate-limit-config.ts`

---

## Observability

### 10.1 Structured Logging (Pino)

All services use Pino for JSON-structured logging to stdout. Three logger factory functions provide contextual bindings:

| Function | Bindings | Usage |
|----------|----------|-------|
| `createLogger(service)` | `{ service }` | Service-level logging |
| `createRequestLogger(service, requestId)` | `{ service, requestId }` | HTTP request-scoped logging |
| `createTaskLogger(service, taskId, requestId?)` | `{ service, taskId, requestId? }` | Task processing-scoped logging |

Log level is controlled via `LOG_LEVEL` env var (default: `info`).

**Source**: `packages/services/src/logger.ts`

### 10.2 Request ID Middleware

Every HTTP request is assigned a unique `X-Request-Id`:

- Accepts incoming `X-Request-Id` header (enables frontend-initiated traces)
- Falls back to `crypto.randomUUID()`
- Stored in Hono context as `requestId` and `requestLogger`
- Echoed in response `X-Request-Id` header
- Propagated to BullMQ jobs for end-to-end correlation

**Source**: `apps/funmagic-backend/src/middleware/request-id.ts`

### 10.3 Prometheus Metrics

All metrics are registered on a shared `metricsRegistry` from prom-client.

#### HTTP Metrics (Backend)

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `http_requests_total` | Counter | `method`, `route`, `status` | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status` | Request latency (buckets: 10ms–10s) |

Routes are normalized (UUIDs → `:id`) to prevent label cardinality explosion. Health and metrics endpoints are excluded.

#### Task Metrics (Workers)

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `tasks_total` | Counter | `tool`, `status` | Total tasks processed |
| `task_duration_seconds` | Histogram | `tool`, `status` | Task processing time (buckets: 0.5s–300s) |
| `task_queue_wait_seconds` | Histogram | `queue` | Time in queue before processing (buckets: 0.1s–60s) |

#### Provider Metrics (Workers)

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `provider_api_duration_seconds` | Histogram | `provider`, `operation` | External API call latency |
| `provider_rate_limit_hits_total` | Counter | `provider` | Rate limit denials/429s |
| `provider_errors_total` | Counter | `provider`, `error_type` | Provider errors by type |

#### Queue Metrics (Sampled every 30s)

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `bullmq_waiting` | Gauge | `queue` | Jobs waiting in queue |
| `bullmq_active` | Gauge | `queue` | Jobs currently processing |
| `bullmq_failed` | Gauge | `queue` | Failed jobs in queue |

Default Node.js metrics (event loop lag, heap, GC) are also collected via `collectDefaultMetrics()`.

**Source**: `packages/services/src/metrics.ts`

### 10.4 Metrics Endpoints

| Service | Port | Path | Auth |
|---------|------|------|------|
| Backend (Hono) | `:8000` | `/metrics` | Optional `Bearer` token via `METRICS_AUTH_TOKEN` |
| AI Tasks Worker | `:9090` | `/metrics` | Optional `Bearer` token via `METRICS_AUTH_TOKEN` |
| Studio Worker | `:9091` | `/metrics` | Optional `Bearer` token via `METRICS_AUTH_TOKEN` |

Each worker runs a standalone `Bun.serve()` HTTP server dedicated to metrics. The backend exposes metrics as a Hono route.

### 10.5 Grafana Alloy

Grafana Alloy runs as a Docker sidecar with `network_mode: host` to access all localhost metrics endpoints.

**Log collection** (→ Grafana Cloud Loki):
- Tails application log files for backend, worker, and studio-worker (default config uses PM2 paths as a template — adjust for your deployment: Docker, systemd, etc.)
- Parses Pino JSON: extracts `level`, `service`, `requestId`, `taskId`, `msg`
- Maps Pino numeric levels to human-readable labels (10→trace, 30→info, 50→error)
- Adds `env` label from `ALLOY_ENV`

**Metrics scraping** (→ Grafana Cloud Prometheus):
- Scrapes three targets every 15s:
  - `localhost:8000/metrics` (backend)
  - `localhost:9090/metrics` (worker)
  - `localhost:9091/metrics` (studio-worker)
- Remote-writes to Grafana Cloud Prometheus endpoint

**Configuration**: `infra/alloy/config.alloy`
**Deployment**: `infra/alloy/docker-compose.yml`

---

## Admin AI Studio

### Overview

The Admin AI Studio provides a chat-based AI playground for administrators. It supports multi-provider image generation and text conversations with session persistence, batch generation, and real-time SSE streaming.

### Provider Workers

| Provider | Worker File | Capabilities | Models |
|----------|------------|-------------|--------|
| OpenAI | `providers/openai-worker.ts` | `chat-image`, `image-only` | GPT-Image-1, GPT-Image-1.5 via Responses API |
| Google | `providers/google-worker.ts` | `chat-image` | Gemini models with image generation |
| fal.ai | `providers/fal-worker.ts` | `utility` | Background removal, upscaling |

Model capabilities:
- `chat-image`: Supports text+image conversations with image generation
- `image-only`: Pure image generation without conversation context
- `utility`: Image processing utilities (background removal, upscaling)

### API Routes

Studio routes are mounted at `/api/admin/studio/` and organized as:

| Route Module | Path Prefix | Purpose |
|-------------|-------------|---------|
| `projects.ts` | `/projects` | CRUD for studio projects (sessions) |
| `generations.ts` | `/generations` | Create generations, SSE streaming |
| `batch.ts` | `/batch` | Batch generation (multiple prompts) |
| `assets.ts` | `/assets` | Studio asset management (presigned URLs) |
| `providers.ts` | `/providers` | List available studio providers |
| `schemas.ts` | — | Zod schemas for studio API validation |

### Database Tables

- `studio_projects`: Session management with `openaiResponseId` for multi-turn OpenAI conversations
- `studio_generations`: Individual messages/generations with `images` (JSONB array of `{ storageKey, type }`), `rawRequest`, `rawResponse` for debugging

### Batch Generation

Admins can submit multiple prompts in a single request. Each prompt creates a separate `studio_generation` record and BullMQ job. All jobs stream progress independently to the client.

### SSE Streaming (Redis Streams + Pub/Sub)

Studio uses the same hybrid pattern as user tasks (see [Real-time Progress](#real-time-progress-sse)) with studio-specific event types:

| Event Type | Data | Purpose |
|-----------|------|---------|
| `text_delta` | `{ chunk }` | Streaming text (typewriter effect) |
| `text_done` | `{ content }` | Final complete text |
| `partial_image` | `{ index, data }` | Image preview (base64) |
| `image_done` | `{ index, storageKey }` | Completed image |
| `complete` | `{ images, content }` | Generation finished |
| `error` | `{ error }` | Generation failed |

**Source**: `packages/worker/src/studio-tools/progress.ts`, `packages/worker/src/studio-tools/types.ts`

---

## Storage Architecture

### S3/MinIO Bucket Structure

Three buckets with visibility-based routing:

```
funmagic-public/                              # CDN-backed public bucket
  shared/{userId}/{assetId}/{filename}        # Published assets (public URLs)

funmagic-private/                             # Private bucket (presigned URLs only)
  {userId}/{module}/{timestamp}_{filename}    # User uploads & AI outputs

funmagic-admin/                               # Admin-only bucket
  {key}                                       # System assets, banners, studio images
```

### Visibility to Bucket Mapping

| Visibility | Bucket | Access Method |
|------------|--------|---------------|
| `public` | `funmagic-public` | Direct CDN URL |
| `private` | `funmagic-private` | Presigned URL (time-limited) |
| `admin-private` | `funmagic-admin` | Admin presigned URL only |

### Presigned URL Flow

```
1. Client requests upload URL → Backend generates presigned PUT URL
2. Client uploads directly to S3 → Bypasses backend for large files
3. Client confirms upload → Backend creates asset record with visibility
4. For downloads:
   - Public: Return CDN URL directly
   - Private: Generate presigned GET URL (configurable TTL)
```

---

## Credit System

### Credit Flow

```
Purchase ──► Balance ──► Reserved ──► Spent (confirmed)
                 ▲            │
                 │   (on fail) │
                 └─── Released ◄┘
```

### Transaction Types

| Type | Description |
|------|-------------|
| `purchase` | Credits bought by user |
| `spend` | Credits consumed by completed task |
| `refund` | Credits returned (refund or adjustment) |
| `bonus` | Promotional credits |
| `admin_adjust` | Manual adjustment by admin |
| `reservation` | Credits reserved when task is submitted |

### Safety Guarantees

- Credits are **reserved** at task creation (atomic: balance check + reserve in one query)
- **Confirmed** (deducted) only on successful task completion
- **Released** back to available balance on task failure
- Users never lose credits on failed tasks

---

## Real-time Progress (SSE)

### 14.1 User Task SSE

Task progress is delivered via Server-Sent Events using a Redis Streams + Pub/Sub hybrid pattern:

**Publishing** (worker side):
1. Store event in Redis Stream (`stream:task:{taskId}`, auto-trim at ~1000 entries, 5 min TTL)
2. Publish to Pub/Sub channel (`task:{taskId}`)

**Subscribing** (backend SSE endpoint):
1. Subscribe to Pub/Sub channel first (no gap)
2. Replay missed events from Redis Stream (XRANGE)
3. Send heartbeat every 6s (resets Bun's 30s idle timeout)
4. Poll DB every 3s as safety net (catches missed terminal events)

Event types: `connected`, `step_started`, `progress`, `step_completed`, `completed`, `failed`, `heartbeat`

### 14.2 Studio SSE

Studio uses the same Redis Streams + Pub/Sub pattern with studio-specific channels:

- Stream key: `stream:studio-gen:{messageId}`
- Pub/Sub channel: `studio-gen:{messageId}`

Studio-specific event types support streaming content: `text_delta`, `text_done`, `partial_image`, `image_done`, `complete`, `error`

---

## Security

### Authentication

- Cookie-based sessions with better-auth (HTTP-only, SameSite, Secure in production)
- Redis secondary storage for fast session lookups
- RBAC enforcement via `requireAuth` and `requireAdmin` middleware

### API Security

- **Security headers middleware**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` (production only)
- **CORS**: Configured for specific frontend origins
- **Rate limiting**: 6-tier user rate limiting (IP and per-user) + per-provider rate limiting (concurrency, RPM, RPD)
- Standard rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`

### Secrets Management

- Provider API keys encrypted at rest with **AES-256-GCM** (scrypt key derivation from `SECRET_KEY`)
- Supports new format (salt:iv:authTag:encrypted) and legacy format (iv:authTag:encrypted)
- Environment variables for infrastructure secrets
- No secrets in client bundles

### Asset Security

- Private assets accessible only via presigned URLs with short TTL
- Public assets served via CDN with immutable cache headers
- User isolation: assets scoped by `userId` in storage key path

---

## Multi-Step Tool Architecture

### Tool Configuration Schema

```json
{
  "steps": [
    {
      "id": "image-gen",
      "name": "Image Generation",
      "type": "image-gen",
      "providerId": "<uuid>",
      "providerModel": "gpt-image-1.5",
      "cost": 20
    },
    {
      "id": "3d-gen",
      "name": "3D Generation",
      "type": "3d-gen",
      "providerId": "<uuid>",
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
3. Worker resolves and decrypts provider credentials
4. Per-provider rate limiting applied (tryAcquire/releaseSlot)
5. Worker executes step, publishes progress via Redis
6. Output stored in `task_payloads.output` with `providerRequest`/`providerResponse`/`providerMeta`
7. Credits confirmed on success, released on failure

---

## Production Deployment

### Single EC2 Architecture

The production setup runs all services on a single EC2 instance (~$40/month):

```
┌──────────────────────────────────────────────────────┐
│               EC2 t3.medium (2 vCPU, 4GB)           │
│                                                      │
│  Docker Compose services:                            │
│  ├── nginx (reverse proxy, :80/:443)                │
│  ├── funmagic-web-vue3 (:3002)                      │
│  ├── funmagic-admin-vue3 (:3003)                    │
│  ├── funmagic-backend (:8000)                       │
│  ├── worker (ai-tasks, metrics :9090)               │
│  ├── admin-worker (studio-tasks, metrics :9091)     │
│  ├── postgres (:5432)                               │
│  ├── redis (:6379)                                  │
│  └── alloy (Grafana Alloy sidecar)                  │
│                                                      │
│  Storage: EBS 50GB gp3                              │
└──────────────────────────────────────────────────────┘
         │
         ▼
      AWS S3 (3 buckets: public, private, admin)
```

### DNS & SSL (Cloudflare)

| Domain | Target |
|--------|--------|
| `funmagic.ai` | EC2 Public IP (A record) |
| `admin.funmagic.ai` | EC2 Public IP (A record) |
| `api.funmagic.ai` | EC2 Public IP (A record) |

SSL is handled via Cloudflare origin certificates mounted in nginx.

### nginx Configuration

nginx routes traffic by subdomain:

- `funmagic.ai` → `web:3002`
- `admin.funmagic.ai` → `admin:3003`
- `api.funmagic.ai` → `backend:8000`

### Scaling Path

When ready for production scale:

| Component | Current | Scaled |
|-----------|---------|--------|
| Database | Docker PostgreSQL | RDS (Multi-AZ) |
| Cache | Docker Redis | ElastiCache |
| Backend | Docker container | App Runner (auto-scaling) |
| Workers | Docker containers | ECS Fargate |
| CDN | Cloudflare proxy | CloudFront |

**Deployment details**: See `deploy/README.md`

---

## Scalability

### Horizontal Scaling

| Component | Strategy |
|-----------|----------|
| Vue 3 SPAs | Static files via CDN, infinitely scalable |
| Backend | Stateless (sessions in Redis), scale via replicas |
| Worker | Scale independently based on queue depth |
| PostgreSQL | Read replicas, connection pooling (PgBouncer) |
| Redis | Redis Cluster for HA, separate instances for cache vs queue |

### Performance Optimizations

- **CDN**: Static assets and public files cached at edge
- **Database**: Indexes on frequently queried columns, JSONB for flexible config
- **Caching**: Redis for sessions, rate limit config (5 min TTL), user tiers (5 min TTL)
- **Async Processing**: All AI operations via BullMQ queue (non-blocking API)
- **Code Splitting**: Vue Router lazy loading for routes
- **Observability**: Prometheus metrics for proactive capacity planning

---

## Design Decisions

### Migration to Vue 3 (2026-02)

The frontend was migrated from Next.js to Vue 3, resulting in a cleaner separation between frontend SPAs and backend API.

| Aspect | Before | After |
|--------|--------|-------|
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

### Auth Routes Centralized to Backend (2026-02)

All authentication routes centralized to the backend at `/api/auth/*`. Cross-subdomain cookies enabled for production multi-domain setup.
