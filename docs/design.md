# FunMagic AI - System Design

## Overview

FunMagic AI is a multi-tenant AI tools platform that enables users to process images, generate 3D models, and perform various AI-powered transformations. The system is designed for scalability, extensibility, and real-time feedback.

## Architecture Diagram

```
                                   ┌─────────────────────────────────────────────────────────────┐
                                   │                         CDN (CloudFront)                    │
                                   │                    Static Assets + Public Files             │
                                   └─────────────────────────────────────────────────────────────┘
                                                              │
                     ┌────────────────────────────────────────┼────────────────────────────────────────┐
                     │                                        │                                        │
                     ▼                                        ▼                                        ▼
            ┌─────────────────┐                    ┌─────────────────┐                    ┌─────────────────┐
            │   funmagic-web  │                    │ funmagic-admin  │                    │     Backend     │
            │   (Next.js 15)  │                    │  (Next.js 15)   │                    │   (Hono + Bun)  │
            │    Port 3000    │                    │    Port 3001    │                    │    Port 8000    │
            └────────┬────────┘                    └────────┬────────┘                    └────────┬────────┘
                     │                                      │                                      │
                     │            REST API + SSE            │                                      │
                     └──────────────────────────────────────┼──────────────────────────────────────┘
                                                            │
                     ┌──────────────────────────────────────┴──────────────────────────────────────┐
                     │                                                                             │
                     ▼                                                                             ▼
            ┌─────────────────┐                                                          ┌─────────────────┐
            │    PostgreSQL   │◄─────────────────────────────────────────────────────────│      Redis      │
            │    (Primary DB) │                                                          │  (Cache + Queue)│
            │    Port 5432    │                                                          │    Port 6379    │
            └─────────────────┘                                                          └────────┬────────┘
                                                                                                  │
                                                                                                  │ BullMQ
                                                                                                  ▼
                                                                                         ┌─────────────────┐
                                                                                         │     Worker      │
                                                                                         │  (BullMQ + Bun) │
                                                                                         └────────┬────────┘
                                                                                                  │
                          ┌───────────────────────────────────────────────────────────────────────┤
                          │                                   │                                   │
                          ▼                                   ▼                                   ▼
                 ┌─────────────────┐               ┌─────────────────┐               ┌─────────────────┐
                 │     OpenAI      │               │     fal.ai      │               │      Tripo      │
                 │ (Image Gen)     │               │ (Background RM) │               │   (3D Models)   │
                 └─────────────────┘               └─────────────────┘               └─────────────────┘

                                                            │
                                                            ▼
                                                   ┌─────────────────┐
                                                   │   MinIO / S3    │
                                                   │  (Asset Storage)│
                                                   │  Port 9000/9001 │
                                                   └─────────────────┘
```

## Tech Stack

### Frontend

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 16.1.6 (App Router) | SSR, RSC, file-based routing |
| Runtime | Bun | Fast package management and runtime |
| Styling | Tailwind CSS | Utility-first CSS |
| Components | shadcn/ui(base ui) | Accessible component library |
| State | TanStack Query | Server state management |
| Forms | React Hook Form + Zod | Type-safe form handling |
| Auth Client | better-auth/client | Session management |

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

This project uses Bun as both the package manager and primary runtime, with Node.js used only for Next.js build stability.

| Environment | Command | Runtime | node_modules |
|-------------|---------|---------|--------------|
| Development | `bun --bun next dev` | Bun | Yes |
| Build | `next build` | Node.js (via Bun) | Yes (during build) |
| Docker Production | `bun server.js` | Bun | No (standalone) |

### The `--bun` Flag

The `--bun` flag forces Bun to use its own JavaScript runtime instead of spawning Node.js:

```bash
# Without --bun: Bun spawns Node.js to run Next.js
bun next dev

# With --bun: Bun uses its own runtime
bun --bun next dev
```

**Why use it?**
- Faster cold starts
- Bun's optimized JavaScript engine
- Consistent runtime between package manager and execution

**Current usage:**
- ✅ `dev` scripts use `--bun` for speed
- ❌ `build` scripts don't use `--bun` (Next.js build is more stable with Node.js)

### Docker Multi-Stage Strategy

All Dockerfiles use `oven/bun:1.3.8-alpine` and follow a 3-stage pattern:

**Stage 1: deps**
- Copies workspace package.json files
- Runs `bun install --frozen-lockfile`
- Creates node_modules for build

**Stage 2: builder**
- Copies node_modules from deps stage
- Copies source code
- Runs `bun run build` (which executes `next build`)

**Stage 3: runner (production)**
- Fresh Bun Alpine image
- Copies only Next.js standalone output (`.next/standalone`)
- NO node_modules copied - standalone bundles everything
- Runs with `bun apps/funmagic-web/server.js`

**Result:** Minimal production image with Bun runtime, no node_modules bloat.

### Why This Approach?

| Concern | Solution |
|---------|----------|
| Dev speed | Bun runtime (`--bun` flag) |
| Build stability | Node.js (Next.js build well-tested) |
| Image size | Standalone output (no node_modules) |
| Production perf | Bun runtime in container |

## Core Components

### 1. Monorepo Structure

```
funmagic-ai/
├── apps/
│   ├── funmagic-web/         # Public-facing Next.js app
│   ├── funmagic-admin/       # Admin dashboard Next.js app
│   └── funmagic-backend/     # Hono API server
├── packages/
│   ├── database/             # Drizzle schema + migrations
│   ├── auth/                 # Shared auth configuration
│   ├── shared/               # API types, utilities
│   ├── services/             # Business logic (credits, storage, progress)
│   └── worker/               # BullMQ worker + tool implementations
└── docker/                   # Docker Compose files
```

### 2. Database Schema

The database contains **15 tables** organized into four domains: Auth, Tools, Tasks, and Commerce.

#### Auth Domain (better-auth)

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `users` | User accounts | `id`, `email`, `name`, `role` (user/admin/super_admin), `emailVerified`, `image`, `createdAt`, `updatedAt` |
| `sessions` | Active user sessions | `id`, `userId` (FK→users), `token`, `expiresAt`, `ipAddress`, `userAgent` |
| `accounts` | OAuth/social accounts | `id`, `userId` (FK→users), `providerId` (google/github), `accountId`, `accessToken`, `refreshToken` |
| `verifications` | Email verification tokens | `id`, `identifier`, `value`, `expiresAt`, `createdAt` |

#### Tools Domain

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `tool_types` | Tool categories | `id`, `name` (unique slug), `displayName`, `icon`, `color`, `description` |
| `tools` | AI tools configuration | `id`, `slug` (unique), `title`, `toolTypeId` (FK→tool_types), `config` (JSONB steps), `creditsCost`, `isActive` |
| `providers` | AI provider credentials | `id`, `name`, `type` (enum), `apiKey` (encrypted), `baseUrl`, `isHealthy`, `healthCheckedAt` |

#### Tasks Domain

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `tasks` | User task records | `id`, `userId` (FK→users), `toolId` (FK→tools), `status` (pending/running/completed/failed), `creditsCost`, `parentTaskId` (FK→tasks), `currentStepId` |
| `task_payloads` | Task input/output data | `id`, `taskId` (FK→tasks), `input` (JSONB), `output` (JSONB), `error` (text) |
| `task_steps` | Multi-step task state | `id`, `taskId` (FK→tasks), `stepId`, `status`, `state` (JSONB), `startedAt`, `completedAt` |
| `assets` | Stored files/outputs | `id`, `userId` (FK→users), `bucket`, `storageKey`, `visibility` (public/private/admin-private), `module`, `mimeType`, `size` |

#### Commerce Domain

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `credits` | User credit balance | `id`, `userId` (FK→users, unique), `balance`, `reservedBalance`, `lifetimeEarned`, `lifetimeSpent` |
| `credit_transactions` | Credit history | `id`, `userId` (FK→users), `type` (purchase/spend/refund/bonus/admin_adjust), `amount`, `balanceAfter`, `referenceId`, `description` |
| `credit_packages` | Purchasable packages | `id`, `name`, `credits`, `price`, `currency`, `stripePriceId`, `isActive`, `sortOrder` |

#### Content Domain

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `banners` | Promotional content | `id`, `title`, `description`, `thumbnail`, `link`, `linkText`, `linkTarget`, `type` (main/side), `position`, `badge`, `badgeColor`, `isActive`, `startsAt`, `endsAt` |

#### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    AUTH DOMAIN                                           │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐            │
│  │     users       │         │    sessions     │         │    accounts     │            │
│  ├─────────────────┤         ├─────────────────┤         ├─────────────────┤            │
│  │ id (PK)         │◄───┬────│ userId (FK)     │         │ userId (FK)     │────┐       │
│  │ email           │    │    │ token           │         │ providerId      │    │       │
│  │ name            │    │    │ expiresAt       │         │ accountId       │    │       │
│  │ role            │    │    └─────────────────┘         └─────────────────┘    │       │
│  │ emailVerified   │    │                                                        │       │
│  └────────┬────────┘    └────────────────────────────────────────────────────────┘       │
│           │                                                                              │
│           │         ┌─────────────────┐                                                  │
│           │         │  verifications  │  (standalone - no FK)                            │
│           │         ├─────────────────┤                                                  │
│           │         │ identifier      │                                                  │
│           │         │ value           │                                                  │
│           │         │ expiresAt       │                                                  │
│           │         └─────────────────┘                                                  │
└───────────┼──────────────────────────────────────────────────────────────────────────────┘
            │
            │ userId
            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   TASKS DOMAIN                                           │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐            │
│  │      tasks      │────────►│  task_payloads  │         │   task_steps    │            │
│  ├─────────────────┤  1:1    ├─────────────────┤         ├─────────────────┤            │
│  │ id (PK)         │◄──┐     │ taskId (FK)     │         │ taskId (FK)     │────┐       │
│  │ userId (FK)     │   │     │ input (JSONB)   │         │ stepId          │    │       │
│  │ toolId (FK)     │   │     │ output (JSONB)  │         │ status          │    │       │
│  │ status          │   │     │ error           │         │ state (JSONB)   │    │       │
│  │ creditsCost     │   │     └─────────────────┘         └─────────────────┘    │       │
│  │ parentTaskId ───┼───┘                                                   1:N  │       │
│  │ currentStepId   │◄───────────────────────────────────────────────────────────┘       │
│  └────────┬────────┘                                                                     │
│           │                                                                              │
│           │ userId    ┌─────────────────┐                                                │
│           │           │     assets      │                                                │
│           │           ├─────────────────┤                                                │
│           └──────────►│ userId (FK)     │                                                │
│                       │ bucket          │                                                │
│                       │ storageKey      │                                                │
│                       │ visibility      │                                                │
│                       │ module          │                                                │
│                       └─────────────────┘                                                │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   TOOLS DOMAIN                                           │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐            │
│  │   tool_types    │────────►│      tools      │         │    providers    │            │
│  ├─────────────────┤  1:N    ├─────────────────┤         ├─────────────────┤            │
│  │ id (PK)         │         │ id (PK)         │         │ id (PK)         │            │
│  │ name            │         │ slug            │         │ name            │            │
│  │ displayName     │         │ title           │         │ type            │            │
│  │ icon            │         │ toolTypeId (FK) │         │ apiKey (enc)    │            │
│  │ color           │         │ config (JSONB)  │◄────────│ baseUrl         │            │
│  └─────────────────┘         │ creditsCost     │  ref    │ isHealthy       │            │
│                              │ isActive        │         └─────────────────┘            │
│                              └─────────────────┘                                         │
│                                      ▲                                                   │
│                                      │ toolId                                            │
│                                      │ (from tasks)                                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  COMMERCE DOMAIN                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────┐         ┌─────────────────────┐     ┌─────────────────┐            │
│  │     credits     │────────►│ credit_transactions │     │ credit_packages │            │
│  ├─────────────────┤  1:N    ├─────────────────────┤     ├─────────────────┤            │
│  │ userId (FK,UQ)  │         │ userId (FK)         │     │ id (PK)         │            │
│  │ balance         │         │ type                │     │ name            │            │
│  │ reservedBalance │         │ amount              │     │ credits         │            │
│  │ lifetimeEarned  │         │ balanceAfter        │     │ price           │            │
│  │ lifetimeSpent   │         │ referenceId         │     │ stripePriceId   │            │
│  └─────────────────┘         └─────────────────────┘     │ isActive        │            │
│         ▲                                                 └─────────────────┘            │
│         │ userId                                                                         │
│         │ (from users)                                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  CONTENT DOMAIN                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────┐                                                                     │
│  │     banners     │  (standalone - no FK)                                               │
│  ├─────────────────┤                                                                     │
│  │ id (PK)         │                                                                     │
│  │ title           │                                                                     │
│  │ type (main/side)│                                                                     │
│  │ thumbnail       │                                                                     │
│  │ link            │                                                                     │
│  │ position        │                                                                     │
│  │ isActive        │                                                                     │
│  │ startsAt/endsAt │                                                                     │
│  └─────────────────┘                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Relationships Summary

```
users ─────┬─── sessions (1:N)
           ├─── accounts (1:N)
           ├─── tasks (1:N)
           ├─── credits (1:1)
           ├─── credit_transactions (1:N)
           └─── assets (1:N)

tool_types ──── tools (1:N)

tasks ─────┬─── task_payloads (1:1)
           ├─── task_steps (1:N)
           └─── tasks (self-ref: parentTaskId)
```

### 3. Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │ Next.js  │     │ Backend  │     │ Database │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │  Login Form    │                │                │
     │───────────────►│                │                │
     │                │  POST /auth    │                │
     │                │───────────────►│                │
     │                │                │  Verify creds  │
     │                │                │───────────────►│
     │                │                │◄───────────────│
     │                │  Set Cookie    │                │
     │                │◄───────────────│                │
     │  Redirect      │                │                │
     │◄───────────────│                │                │
     │                │                │                │

Session stored in:
- HTTP-only cookie (secure, SameSite)
- Redis for session data
```

### 4. Task Processing Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │ Backend  │     │  Redis   │     │  Worker  │     │ Provider │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │                │
     │ POST /tasks    │                │                │                │
     │───────────────►│                │                │                │
     │                │ Reserve credits│                │                │
     │                │────────────────│                │                │
     │                │ Add job        │                │                │
     │                │───────────────►│                │                │
     │ { taskId }     │                │                │                │
     │◄───────────────│                │                │                │
     │                │                │                │                │
     │ SSE /stream    │                │                │                │
     │───────────────►│                │                │                │
     │                │ Subscribe      │                │                │
     │                │───────────────►│  Pick job      │                │
     │                │                │◄───────────────│                │
     │                │                │                │ API call       │
     │                │                │                │───────────────►│
     │                │                │  Progress      │                │
     │                │◄───────────────│◄───────────────│                │
     │ SSE: progress  │                │                │◄───────────────│
     │◄───────────────│                │                │                │
     │                │                │  Complete      │                │
     │                │◄───────────────│◄───────────────│                │
     │ SSE: complete  │                │                │                │
     │◄───────────────│                │                │                │
```

## Storage Architecture

### S3/MinIO Bucket Structure

Three buckets with visibility-based routing:

```
funmagic-public/                              # CDN-backed public bucket
└── shared/{userId}/{assetId}/{filename}      # Published assets (public URLs)

funmagic-private/                             # Private bucket (presigned URLs only)
└── {userId}/{module}/{timestamp}_{filename}  # User uploads & AI outputs

funmagic-admin/                               # Admin-only bucket
└── {key}                                     # System assets, banners, etc.
```

### Visibility → Bucket Mapping

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
1. Client requests upload URL → Backend generates presigned PUT URL
2. Client uploads directly to S3 → Bypasses backend for large files
3. Client confirms upload → Backend creates asset record with visibility
4. For downloads:
   - Public: Return CDN URL directly
   - Private: Generate presigned GET URL (TTL: 1 hour default)
```

## Credit System

### Credit Flow

```
┌────────────────────────────────────────────────────────────────┐
│                         Credit Lifecycle                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐    ┌─────────────┐    ┌──────────┐    ┌────────┐ │
│  │ Purchase│───►│   Balance   │───►│ Reserved │───►│ Spent  │ │
│  └─────────┘    └─────────────┘    └──────────┘    └────────┘ │
│                        ▲                 │                     │
│                        │                 │ (on failure)        │
│                        └─────────────────┘                     │
│                           Released                             │
└────────────────────────────────────────────────────────────────┘
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

### Colocated Route Structure

Each tool has its own dedicated route with colocated components and actions:

```
app/[locale]/tools/
├── page.tsx                    # Tools listing
├── [slug]/page.tsx             # Fallback for unmigrated tools
├── figme/
│   ├── page.tsx                # Server Component - fetches tool, checks isActive
│   ├── actions.ts              # Server Actions (colocated with tool)
│   ├── figme-client.tsx        # Client Component - handles user journey
│   ├── style-selector.tsx      # Style selection UI
│   ├── result-display.tsx      # Image result display
│   └── three-d-viewer.tsx      # 3D model viewer
├── background-remove/
│   ├── page.tsx
│   ├── actions.ts
│   ├── background-remove-client.tsx
│   └── before-after-comparison.tsx
└── crystal-memory/
    ├── page.tsx
    ├── actions.ts
    ├── crystal-memory-client.tsx
    └── point-cloud-viewer.tsx
```

### Benefits

1. **Code organization** - All tool-related code in one folder (including actions)
2. **Easier to understand** - Clear ownership of code per tool
3. **No executor dispatcher** - Direct imports, no runtime switching
4. **Custom metadata** - Each tool page can have custom loading states, error handling
5. **Follows Next.js conventions** - App Router best practices
6. **Colocated actions** - Server Actions live with their tool

### Tool Page Pattern

Each tool's `page.tsx` follows this pattern:

```tsx
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { setRequestLocale } from 'next-intl/server'
import { getToolBySlug } from '@/lib/queries/tools'
import { MyToolClient } from './my-tool-client'
import type { SupportedLocale } from '@funmagic/shared'

export default async function MyToolPage({ params }) {
  // Defer to runtime to avoid build-time locale issues
  await connection()

  const { locale } = await params
  setRequestLocale(locale)

  const tool = await getToolBySlug('my-tool', locale as SupportedLocale)

  // Check if tool exists AND is active (admin can disable tools)
  if (!tool || !tool.isActive) {
    notFound()
  }

  return <MyToolClient tool={tool} />
}
```

### Colocated Actions Pattern

Each tool has its own `actions.ts` with hardcoded `toolSlug`:

```tsx
'use server'

import { api } from '@/lib/api'
import { auth } from '@funmagic/auth/server'
import { headers, cookies } from 'next/headers'
import { revalidateTag } from 'next/cache'

export async function createTaskAction(input: { imageStorageKey: string }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' }
  }

  const { data, error } = await api.POST('/api/tasks', {
    body: {
      toolSlug: 'my-tool',  // Hardcoded - no need to pass from client
      stepId: 'step-id',
      input: { imageStorageKey: input.imageStorageKey },
    },
    headers: { cookie: (await cookies()).toString() },
  })

  if (error) {
    return { success: false, error: error.error, code: 'UNKNOWN' }
  }

  revalidateTag(`user-credits-${session.user.id}`, 'default')

  return { success: true, taskId: data!.task.id }
}
```

### Storage Key vs URL Pattern

Workers accept both `imageUrl` (direct URL) and `imageStorageKey` (S3 key):

```typescript
// In worker
let imageUrl = input.imageUrl;
if (!imageUrl && input.imageStorageKey) {
  imageUrl = await getDownloadUrl(input.imageStorageKey);
}
```

This allows:
- Client uploads to S3 via presigned URL → gets storage key
- Client passes storage key to server action
- Worker converts storage key to presigned URL for API calls

## Security

### Authentication

- **Method**: Cookie-based sessions with better-auth
- **Session Storage**: Redis with TTL
- **RBAC Roles**: `user`, `admin`, `super_admin`

### API Security

- All `/api/*` routes require authentication (except public endpoints)
- Admin routes check `role === 'admin' || role === 'super_admin'`
- Rate limiting via Redis (planned)

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
| Next.js Apps | Stateless, scale via replicas |
| Backend | Stateless, scale via replicas |
| Worker | Scale based on queue depth |
| PostgreSQL | Read replicas, connection pooling |
| Redis | Redis Cluster for high availability |

### Performance Optimizations

- **CDN**: Static assets and public files cached at edge
- **Database**: Indexes on frequently queried columns
- **Caching**: Redis for session, hot data, rate limits
- **Async Processing**: All AI operations via BullMQ queue

## Next.js Caching Strategy

### Core Principles

1. **`'use cache'` only** → Static, build-time execution (requires DB/Redis at build)
2. **`connection()` only** → Dynamic, runtime-only execution (no caching)
3. **Never combine both** → Pick one pattern per function

### Cache Profiles

Defined in `next.config.ts`:

```typescript
cacheLife: {
  tools: { stale: 300, revalidate: 600, expire: 3600 },      // 5min stale, 10min revalidate, 1hr expire
  hours: { stale: 1800, revalidate: 3600, expire: 86400 },   // 30min stale, 1hr revalidate, 24hr expire
  user: { stale: 60, revalidate: 300, expire: 3600 },        // 1min stale, 5min revalidate, 1hr expire
}
```

### Query Functions Pattern

| Function | Pattern | Behavior | Use Case |
|----------|---------|----------|----------|
| `getHomepageData()` | `'use cache'` | Build-time, cached | Public homepage data |
| `getFeaturedTools()` | `'use cache'` | Build-time, cached | Public tools list |
| `getTools()` | `'use cache'` | Build-time, cached | Public tools catalog |
| `getToolBySlug()` | `'use cache'` | Build-time, cached | Public tool detail |
| `getCreditPackages()` | `'use cache'` | Build-time, cached | Public pricing page |
| `getCreditBalance()` | `connection()` | Runtime, dynamic | User-specific balance |
| `getCreditTransactions()` | `connection()` | Runtime, dynamic | User-specific history |
| `getUserAssets()` | `connection()` | Runtime, dynamic | User-specific assets |

### Static (Cached) Pattern

```typescript
// For public, non-user-specific data
export async function getTools() {
  'use cache'
  cacheLife('tools')
  cacheTag('tools-list')

  const { data } = await api.GET('/api/tools')
  return data?.tools ?? []
}
```

- Executes at **build time** (requires infrastructure)
- Cached and served statically
- Revalidated via `revalidateTag('tools-list')`

### Dynamic (Runtime) Pattern

```typescript
// For user-specific or auth-required data
export async function getUserAssets() {
  await connection()  // Defer to runtime

  const { data } = await api.GET('/api/assets', {
    headers: { cookie: (await cookies()).toString() },
  })
  return data?.assets ?? []
}
```

- Skipped at build time
- Executes fresh on every request
- No caching (appropriate for user-specific data)

### Protected Routes

Protected layouts use dynamic rendering automatically via `headers()`:

```typescript
export default async function ProtectedLayout({ children, params }) {
  const { locale } = await params
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect({ href: '/login', locale })
  }

  return <>{children}</>
}
```

- `headers()` opts into dynamic rendering
- No `connection()` needed
- No caching (auth checked per-request)

### Cache Invalidation

Use `revalidateTag()` in Server Actions after mutations:

```typescript
'use server'

export async function updateToolAction(data: ToolInput) {
  await api.PUT('/api/tools/{id}', { body: data })

  revalidateTag('tools-list')        // Invalidate tools catalog
  revalidateTag(`tool-${data.slug}`) // Invalidate specific tool
}
```

### Build Requirements

Static cached functions run at build time, so infrastructure must be available:

```bash
# Build requires DB + Redis running
docker compose up -d postgres redis
bun run build
```

### Summary Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CACHING DECISION TREE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Is data user-specific or requires auth?                        │
│                     │                                            │
│          ┌─────────┴─────────┐                                   │
│          │                   │                                   │
│         YES                  NO                                  │
│          │                   │                                   │
│          ▼                   ▼                                   │
│   ┌─────────────┐     ┌─────────────┐                           │
│   │ connection()│     │ 'use cache' │                           │
│   │  (dynamic)  │     │  (static)   │                           │
│   └─────────────┘     └─────────────┘                           │
│          │                   │                                   │
│          ▼                   ▼                                   │
│   - No caching         - cacheLife()                             │
│   - Runtime only       - cacheTag()                              │
│   - Per-request        - Build-time                              │
│   - Uses cookies()     - Revalidate via tag                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

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
NEXT_PUBLIC_API_URL=https://api.funmagic.ai
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
- **Logging**: Structured JSON logs → aggregator
- **Tracing**: OpenTelemetry for distributed tracing
- **Alerts**: Based on error rates, queue depth, latency

---

## Design Decisions

### Auth Routes Centralized to Backend (2026-02-02)

Auth routes have been centralized to the backend. All authentication requests now go through `http://localhost:8000/api/auth/*` instead of each Next.js app having its own auth endpoint.

#### Architecture Change

```
Before:
┌─────────────────┐     ┌─────────────────┐
│   Web App       │     │   Admin App     │
│   :3000         │     │   :3001         │
│ /api/auth/*  ◄──┼─────┼── /api/auth/*   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│              Database                    │
└─────────────────────────────────────────┘

After:
┌─────────────────┐     ┌─────────────────┐
│   Web App       │     │   Admin App     │
│   :3000         │     │   :3001         │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
         ┌─────────────────────┐
         │      Backend        │
         │       :8000         │
         │    /api/auth/*      │
         └──────────┬──────────┘
                    ▼
         ┌─────────────────────┐
         │      Database       │
         └─────────────────────┘
```

#### Files Modified

1. **`packages/auth/src/server.ts`** - Removed `createAuth()` factory, simplified to single `auth` instance
2. **`apps/funmagic-backend/src/index.ts`** - Added auth route handler for `/api/auth/*`
3. **`apps/funmagic-web/src/lib/auth-client.ts`** - Points to `NEXT_PUBLIC_API_URL` (backend)
4. **`apps/funmagic-admin/src/lib/auth-client.ts`** - Points to `NEXT_PUBLIC_API_URL` (backend)
5. **`.env.example`** - Removed `BETTER_AUTH_ADMIN_URL`, updated `BETTER_AUTH_URL` to backend
6. **`docker/docker-compose.yml`** - Updated environment variables for centralized auth

#### Files Deleted

- `apps/funmagic-web/src/app/api/auth/[...all]/route.ts`
- `apps/funmagic-admin/src/app/api/auth/[...all]/route.ts`

#### SSR Session Validation

Protected layouts use `auth.api.getSession()` which validates sessions **directly against the database** - not via HTTP:

- **Auth operations** (login/logout/signup) → handled by backend `/api/auth/*`
- **Session validation** (SSR) → direct DB check via `auth.api.getSession()`, no HTTP call needed

#### Cookie Considerations

- **Localhost**: Cookies work across ports (same domain)
- **Production** (different subdomains like `api.example.com` ↔ `app.example.com`):
  ```typescript
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
  }
  ```
