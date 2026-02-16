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
```

### Available Services

| Service | URL | Purpose |
|---------|-----|---------|
| Web App (Vue 3) | http://localhost:3002 | Public-facing app |
| Admin App (Vue 3) | http://localhost:3003 | Admin dashboard |
| Backend API | http://localhost:8000 | Hono REST API + SSE |
| MinIO Console | http://localhost:9001 | S3 storage UI |
| Drizzle Studio | `bun run db:studio` | Database UI |

---

## Adding a New Tool

This guide walks through adding a new AI tool to the platform.

### Overview

Adding a tool requires changes in 3-4 places:

1. **Database**: Create tool record via Admin UI or migration
2. **Worker**: Implement tool worker logic
3. **Frontend** (optional): Custom UI components if needed

### Step 1: Define Tool Configuration

Each tool has a `config` JSON stored in the database. Design your config first:

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

**Step Types** (common patterns):
- `image-gen` - Generate images (OpenAI, Stability, etc.)
- `3d-gen` - Generate 3D models (Tripo, etc.)
- `background-remove` - Remove backgrounds (fal.ai, etc.)
- `upscale` - Image upscaling
- `style-transfer` - Apply artistic styles

### Step 2: Create Provider (Admin UI)

1. Go to Admin -> Providers -> Add Provider
2. Fill in: Name, Display Name, Type, API Key, Base URL
3. (Optional) Set `config.rateLimit` to control per-provider throughput — `maxConcurrency`, `maxPerMinute`, `maxPerDay`. If not set, the provider runs without rate limiting.

### Step 3: Create Tool Type (Admin UI)

1. Go to Admin -> Tool Types -> Add Type
2. Fill in: Name, Display Name, Icon, Color

### Step 4: Create Tool Record (Admin UI)

1. Go to Admin -> Tools -> Add Tool
2. Fill in: Slug, Title, Description, Tool Type, Config JSON

### Step 5: Implement Worker

Create a new file in `packages/worker/src/tools/my-new-tool.ts` with the tool worker implementation following the `ToolWorker` interface pattern (see existing tools like `figme.ts` for reference).

### Step 6: Register Worker

Add your worker to the registry in `packages/worker/src/tools/index.ts`.

### Step 7: Create Tool View (Frontend)

Create a dedicated Vue view for your tool:

```vue
<!-- apps/funmagic-web-vue3/src/views/tools/MyNewToolView.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NAlert } from 'naive-ui'
import { useQuery, useMutation } from '@tanstack/vue-query'
import { api } from '@/lib/api'

const route = useRoute()

// Load tool data
const { data: toolData, isLoading } = useQuery({
  queryKey: ['tool', 'my-new-tool'],
  queryFn: async () => {
    const { data, error } = await api.GET('/api/tools/{slug}', {
      params: { path: { slug: 'my-new-tool' } }
    })
    if (error) throw new Error(error.error)
    return data
  }
})

// Submit task
const submitMutation = useMutation({
  mutationFn: async (input: { imageStorageKey: string }) => {
    const { data, error } = await api.POST('/api/tasks', {
      body: {
        toolSlug: 'my-new-tool',
        input: { imageStorageKey: input.imageStorageKey }
      }
    })
    if (error) throw new Error(error.error)
    return data
  }
})
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="toolData?.tool">
    <h1>{{ toolData.tool.title }}</h1>
    <!-- Tool UI here -->
  </div>
</template>
```

Add the route in `apps/funmagic-web-vue3/src/router/index.ts`:

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
bun run dev:backend
bun run api:generate
```

### Step 9: Test Your Tool

1. Create the tool via Admin UI
2. Navigate to `/tools/my-new-tool`
3. Verify task processing, progress updates, and result storage

---

## Codebase Structure

### Apps

#### `apps/funmagic-web-vue3/` - Public Web App (Vue 3)

```
src/
├── views/                    # Vue views (pages)
│   ├── HomeView.vue
│   ├── ToolsView.vue
│   ├── AssetsView.vue
│   ├── tools/               # Tool-specific views
│   │   ├── FigmeView.vue
│   │   ├── BackgroundRemoveView.vue
│   │   └── CrystalMemoryView.vue
│   └── auth/
│       ├── LoginView.vue
│       └── RegisterView.vue
├── components/               # Reusable Vue components
│   ├── tools/               # Tool components (PointCloudViewer, etc.)
│   ├── upload/              # Upload components
│   └── layout/              # Header, footer, nav
├── composables/             # Vue composables
│   ├── useFileUpload.ts
│   └── useTaskProgress.ts
├── stores/                  # Pinia stores
├── locales/                 # i18n translations
├── router/                  # Vue Router config
├── lib/
│   ├── api.ts              # openapi-fetch client
│   └── utils.ts
└── App.vue
```

#### `apps/funmagic-admin-vue3/` - Admin Dashboard (Vue 3)

```
src/
├── views/
│   ├── auth/LoginView.vue
│   └── dashboard/
│       ├── tools/           # Tool management (list, create, detail)
│       ├── providers/       # Provider management
│       ├── users/           # User management
│       ├── ai-studio/       # AI Studio chat interface
│       ├── tasks/           # Task monitoring
│       ├── ai-tasks/        # AI task management
│       └── content/         # Banner management
├── components/
│   ├── tools/              # ToolConfigForm, etc.
│   ├── shared/             # PageHeader, StatusBadge
│   └── layout/             # AdminSidebar, etc.
├── composables/
├── stores/
└── router/
```

#### `apps/funmagic-backend/` - API Server (Hono)

```
src/
├── index.ts                  # App entry, route mounting
├── routes/
│   ├── health.ts             # Health check endpoints
│   ├── tools.ts              # Public tool endpoints
│   ├── tasks.ts              # Task CRUD + SSE stream
│   ├── assets.ts             # Asset upload/download
│   ├── credits.ts            # Credit balance/history
│   ├── banners.ts            # Banner endpoints
│   ├── upload.ts             # File upload handling
│   └── admin/
│       ├── tools.ts          # Admin tool CRUD
│       ├── tool-types.ts     # Tool type CRUD
│       ├── providers.ts      # Provider CRUD
│       ├── banners.ts        # Admin banner CRUD
│       ├── ai-studio.ts      # AI Studio endpoints
│       └── users.ts          # User management
├── middleware/
│   └── auth.ts               # requireAuth / requireAdmin
├── schemas/
│   └── index.ts              # Zod schemas for API
└── lib/
    └── queue.ts              # BullMQ job creation
```

### Packages

#### `packages/database/` - Database Layer

```
src/
├── index.ts                  # DB client + exports
├── types/
│   └── provider-rate-limit.ts # Rate limit config types (ProviderRateLimitConfig, ProviderConfig)
└── schema/
    ├── index.ts              # Schema exports
    ├── users.ts              # users, sessions, accounts, verifications
    ├── tools.ts              # tools, tool_types
    ├── tasks.ts              # tasks, task_payloads, task_steps
    ├── credits.ts            # credits, credit_transactions, credit_packages
    ├── assets.ts             # assets
    ├── providers.ts          # providers
    ├── admin-providers.ts    # admin_providers
    ├── banners.ts            # banners
    └── admin-ai-studio.ts    # admin_chats, admin_messages
```

#### `packages/worker/` - Background Worker

```
src/
├── index.ts                  # BullMQ worker setup
├── types.ts                  # Worker types
├── tools/
│   ├── index.ts              # Tool registry
│   ├── figme.ts              # FigMe tool (2-step)
│   ├── background-remove.ts  # Background removal
│   └── crystal-memory.ts     # Crystal memory (pipeline)
├── admin-tools/
│   └── index.ts              # Admin AI task processing
└── lib/
    ├── credentials.ts        # Provider credential decryption
    ├── progress.ts           # Redis progress publishing
    ├── provider-errors.ts    # Provider 429 detection + exponential backoff
    └── storage.ts            # S3 upload utilities
```

#### `packages/services/` - Shared Business Logic

```
src/
├── index.ts                  # Service exports
├── credit.ts                 # Credit operations
├── storage.ts                # S3 operations
├── progress.ts               # Progress tracking
├── provider-rate-limiter.ts  # Per-provider rate limiting (concurrency, RPM, RPD)
└── redis.ts                  # Redis connection singleton
```

#### `packages/auth/` - Authentication

```
src/
├── server.ts                 # better-auth server config
└── client.ts                 # better-auth client config
```

---

## Admin AI Studio

The Admin AI Studio provides a chat-based AI playground for administrators.

### Features

- Multi-provider support (OpenAI, Google, fal)
- Multi-turn conversations with session persistence
- Image generation and quotation
- Model capability detection (chat-image, image-only, utility)

### Key Files

- **Database**: `packages/database/src/schema/admin-ai-studio.ts`
- **Backend API**: `apps/funmagic-backend/src/routes/admin/ai-studio.ts`
- **Frontend**: `apps/funmagic-admin-vue3/src/views/dashboard/ai-studio/`
- **Worker**: `packages/worker/src/admin-tools/`

---

## Common Development Tasks

### Adding a Database Table

1. Create schema in `packages/database/src/schema/my-table.ts`
2. Export from `packages/database/src/schema/index.ts`
3. Generate migration: `bun run db:generate`
4. Apply migration: `bun run db:migrate`

### Adding an API Endpoint

1. Create route in `apps/funmagic-backend/src/routes/`
2. Mount in `apps/funmagic-backend/src/index.ts`
3. Regenerate types: `bun run api:generate`

### Adding a UI Component

Use Naive UI components in Vue 3 apps:

```vue
<template>
  <n-card>
    <n-button type="primary">{{ label }}</n-button>
  </n-card>
</template>

<script setup lang="ts">
defineProps<{ label: string }>()
</script>
```

### Environment Variables

Add new variables to `.env.example`, `.env`, and `docker/docker-compose.yml`.

---

## Testing

### Manual Testing

```bash
bun run dev:backend   # Just backend
bun run dev:worker    # Just worker
bun run dev:web       # Just Vue web app
bun run dev:admin     # Just Vue admin app
bun run infra:logs    # Infrastructure logs
```

### Database Queries

```bash
bun run db:studio
docker exec -it funmagic-postgres psql -U funmagic -d funmagic
```

### API Testing

```bash
curl http://localhost:8000/health
curl http://localhost:8000/openapi.json
```

---

## Troubleshooting

### Common Issues

**"No worker found for tool"**
- Ensure tool slug matches worker registry key in `packages/worker/src/tools/index.ts`

**"Provider not found"**
- Verify `providerId` in tool config matches a provider UUID in database

**Worker not processing jobs**
- Check Redis connection: `bun run infra:logs`
- Verify worker is running: `bun run dev:worker`

**SSE not working**
- Check Redis pub/sub is functioning
- Verify task ID matches between backend and worker

**Vue app build errors**
- Clear cache: `rm -rf node_modules/.vite`
- Rebuild: `bun install && bun run build`

**CORS issues in development**
- Ensure backend CORS config allows frontend origins (localhost:3002, localhost:3003)

**Provider 429 errors**
- Provider 429 (rate limit) errors are auto-retried via `DelayedError` — they are **not** counted as task failures
- The job is rescheduled with exponential backoff (1s, 2s, 4s... up to 60s), up to 3 retries by default
- To tune: set `config.rateLimit` on the provider record (via Admin UI or API) with `maxConcurrency`, `maxPerMinute`, `maxPerDay`
- To disable auto-retry: set `config.rateLimit.retryOn429: false`
- See `packages/worker/src/lib/provider-errors.ts` for 429 detection logic

### Logs

```bash
bun run dev                              # All services
bun run dev:backend 2>&1 | tee backend.log
bun run dev:worker 2>&1 | tee worker.log
```
