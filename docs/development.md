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
| Web App | http://localhost:3000 | Public-facing app |
| Admin App | http://localhost:3001 | Admin dashboard |
| Backend API | http://localhost:8000 | REST API + SSE |
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
  // Tool-specific options
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

Before creating a tool, ensure the AI provider exists:

1. Go to Admin → Providers → Add Provider
2. Fill in:
   - **Name**: `fal` (slug-like)
   - **Display Name**: `fal.ai`
   - **Type**: Select from enum (openai, fal, replicate, etc.)
   - **API Key**: Your provider API key (encrypted at rest)
   - **Base URL**: Optional override

### Step 3: Create Tool Type (Admin UI)

Tool types categorize tools:

1. Go to Admin → Tool Types → Add Type
2. Fill in:
   - **Name**: `background-removal`
   - **Display Name**: `Background Removal`
   - **Icon**: Lucide icon name (e.g., `eraser`)
   - **Color**: Hex color for UI

### Step 4: Create Tool Record (Admin UI)

1. Go to Admin → Tools → Add Tool
2. Fill in:
   - **Slug**: `my-new-tool` (URL-friendly, unique)
   - **Title**: `My New Tool`
   - **Description**: Full description (markdown supported)
   - **Tool Type**: Select from dropdown
   - **Config**: Paste your JSON config

### Step 5: Implement Worker

Create a new file in `packages/worker/src/tools/`:

```typescript
// packages/worker/src/tools/my-new-tool.ts

import { db, tasks, providers } from '@funmagic/database';
import { eq } from 'drizzle-orm';
import type { ToolWorker, WorkerContext, StepResult, ToolConfig } from '../types';
import { decryptCredentials } from '../lib/credentials';
import { uploadFromUrl } from '../lib/storage';
import { createProgressTracker } from '../lib/progress';

/**
 * Tool config structure (stored in tool.config)
 */
interface MyToolConfig extends ToolConfig {
  steps: Array<{
    id: string;
    name: string;
    type: string;
    providerId: string;
    providerModel: string;
    cost: number;
  }>;
  // Add tool-specific config here
}

/**
 * Input schema for the tool
 */
interface MyToolInput {
  imageUrl?: string;
  prompt?: string;
  // Add input fields here
}

/**
 * Call the AI provider API
 */
async function callProvider(params: {
  apiKey: string;
  model: string;
  input: MyToolInput;
  onProgress: (progress: number, message: string) => Promise<void>;
}): Promise<{ resultUrl: string }> {
  const { apiKey, model, input, onProgress } = params;

  await onProgress(10, 'Starting processing...');

  // Implement your API call here
  const response = await fetch('https://api.provider.com/v1/process', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      ...input,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  await onProgress(80, 'Processing complete');

  const result = await response.json();
  return { resultUrl: result.output_url };
}

/**
 * Tool worker implementation
 */
export const myNewToolWorker: ToolWorker = {
  async execute(context: WorkerContext): Promise<StepResult> {
    const { taskId, stepId, userId, input, redis } = context;
    const progress = createProgressTracker(redis, taskId);

    try {
      // 1. Get task with tool config
      const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, taskId),
        with: { tool: true },
      });

      if (!task?.tool) {
        throw new Error('Task or tool not found');
      }

      const config = task.tool.config as MyToolConfig;
      const toolInput = input as MyToolInput;

      // 2. Get step config (use stepId if multi-step, or first step)
      const step = stepId
        ? config.steps.find(s => s.id === stepId)
        : config.steps[0];

      if (!step) {
        throw new Error(`Step not found: ${stepId || 'default'}`);
      }

      // 3. Get provider credentials
      const provider = await db.query.providers.findFirst({
        where: eq(providers.id, step.providerId),
      });

      if (!provider) {
        throw new Error('Provider not found');
      }

      const credentials = decryptCredentials(provider);

      if (!credentials.apiKey) {
        throw new Error(`No API key for provider "${provider.displayName}"`);
      }

      // 4. Start progress tracking
      await progress.startStep(step.id, step.name);

      // 5. Call the AI provider
      const result = await callProvider({
        apiKey: credentials.apiKey,
        model: step.providerModel,
        input: toolInput,
        onProgress: async (p, msg) => progress.updateProgress(p, msg),
      });

      // 6. Upload result to S3
      await progress.updateProgress(90, 'Saving result');

      const asset = await uploadFromUrl({
        url: result.resultUrl,
        userId,
        module: 'my-new-tool',
        taskId,
        filename: `result_${Date.now()}.png`,
      });

      // 7. Complete
      await progress.updateProgress(100, 'Complete');
      await progress.completeStep({ assetId: asset.id });

      return {
        success: true,
        assetId: asset.id,
        output: {
          assetId: asset.id,
          storageKey: asset.storageKey,
        },
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await progress.fail(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};
```

### Step 6: Register Worker

Add your worker to the registry:

```typescript
// packages/worker/src/tools/index.ts

import type { ToolWorker } from '../types';
import { figmeWorker } from './figme';
import { backgroundRemoveWorker } from './background-remove';
import { myNewToolWorker } from './my-new-tool';  // Add import

const toolWorkers: Record<string, ToolWorker> = {
  'figme': figmeWorker,
  'background-remove': backgroundRemoveWorker,
  'my-new-tool': myNewToolWorker,  // Add registration
};

// ... rest of file
```

### Step 7: Create Colocated Tool Route (Frontend)

Create a dedicated route for your tool with colocated components and actions:

```bash
mkdir -p apps/funmagic-web/src/app/\[locale\]/tools/my-new-tool
```

**Create `page.tsx` (Server Component):**

```tsx
// apps/funmagic-web/src/app/[locale]/tools/my-new-tool/page.tsx
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { setRequestLocale } from 'next-intl/server'
import { getToolBySlug } from '@/lib/queries/tools'
import { MyNewToolClient } from './my-new-tool-client'
import type { SupportedLocale } from '@funmagic/shared'

interface PageProps {
  params: Promise<{ locale: string }>
}

async function MyNewToolContent({ params }: { params: Promise<{ locale: string }> }) {
  // Defer to runtime to avoid build-time locale issues
  await connection()

  const { locale } = await params
  setRequestLocale(locale)

  const tool = await getToolBySlug('my-new-tool', locale as SupportedLocale)

  // Check if tool exists AND is active (admin can disable tools)
  if (!tool || !tool.isActive) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-4">{tool.title}</h1>
      {tool.description && (
        <p className="text-muted-foreground mb-8">{tool.description}</p>
      )}
      <MyNewToolClient tool={tool} />
    </div>
  )
}

export default async function MyNewToolPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="animate-pulse" />}>
      <MyNewToolContent params={params} />
    </Suspense>
  )
}
```

**Create `actions.ts` (Colocated Server Actions):**

```tsx
// apps/funmagic-web/src/app/[locale]/tools/my-new-tool/actions.ts
'use server'

import { api } from '@/lib/api'
import { auth } from '@funmagic/auth/server'
import { headers, cookies } from 'next/headers'
import { revalidateTag } from 'next/cache'

type CreateTaskResult =
  | { success: true; taskId: string; creditsCost: number }
  | { success: false; error: string; code: string }

export async function createTaskAction(input: {
  imageStorageKey: string
}): Promise<CreateTaskResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' }
  }

  const { data, error } = await api.POST('/api/tasks', {
    body: {
      toolSlug: 'my-new-tool',  // Hardcoded - no need to pass from client
      stepId: 'step-id',        // Your step ID
      input: {
        imageStorageKey: input.imageStorageKey,
      },
    },
    headers: { cookie: (await cookies()).toString() },
  })

  if (error) {
    if (error.error?.includes('Insufficient credits')) {
      return { success: false, error: error.error, code: 'INSUFFICIENT_CREDITS' }
    }
    return { success: false, error: error.error || 'Unknown error', code: 'UNKNOWN' }
  }

  revalidateTag(`user-credits-${session.user.id}`, 'default')

  return {
    success: true,
    taskId: data!.task.id,
    creditsCost: data!.task.creditsCost ?? 0,
  }
}

// Re-export shared actions
export { getTaskStatusAction, saveTaskOutputAction } from '@/app/actions/tools'
```

**Create `my-new-tool-client.tsx` (Client Component):**

```tsx
// apps/funmagic-web/src/app/[locale]/tools/my-new-tool/my-new-tool-client.tsx
'use client'

import { useState, useCallback } from 'react'
import { useSessionContext } from '@/components/providers/session-provider'
import { useSubmitUpload } from '@/hooks/useSubmitUpload'
import { useTaskProgress } from '@/hooks/useTaskProgress'
import { createTaskAction } from './actions'
import { ImagePicker } from '@/components/upload/ImagePicker'
import { TaskProgressDisplay } from '@/components/tools/TaskProgressDisplay'
import type { ToolDetail } from '@/lib/types/tool-configs'

export function MyNewToolClient({ tool }: { tool: ToolDetail }) {
  const { session } = useSessionContext()
  const [step, setStep] = useState<'upload' | 'processing' | 'result'>('upload')
  const [taskId, setTaskId] = useState<string | null>(null)
  const [result, setResult] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)

  const upload = useSubmitUpload({
    route: 'my-new-tool',
    onError: (err) => setError(err),
  })

  useTaskProgress({
    taskId,
    onComplete: (output) => {
      setResult(output)
      setStep('result')
      setTaskId(null)
    },
    onFailed: (err) => {
      setError(err)
      setStep('upload')
      setTaskId(null)
    },
  })

  const handleSubmit = useCallback(async () => {
    if (!upload.pendingFile) return
    setError(null)

    const storageKey = await upload.uploadOnSubmit()
    if (!storageKey) {
      setError('Upload failed')
      return
    }

    const taskResult = await createTaskAction({ imageStorageKey: storageKey })
    if (!taskResult.success) {
      setError(taskResult.error)
      return
    }

    setTaskId(taskResult.taskId)
    setStep('processing')
  }, [upload])

  if (!session) {
    return <div>Please sign in to use this tool</div>
  }

  return (
    <div className="bg-card p-6 rounded-xl shadow-sm border">
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {step === 'upload' && (
        <>
          <ImagePicker
            onFileSelect={upload.setFile}
            preview={upload.preview}
          />
          <button onClick={handleSubmit} disabled={!upload.pendingFile}>
            Process Image
          </button>
        </>
      )}

      {step === 'processing' && taskId && (
        <TaskProgressDisplay taskId={taskId} />
      )}

      {step === 'result' && result && (
        <div>Result: {JSON.stringify(result)}</div>
      )}
    </div>
  )
}
```

### Step 8: Regenerate API Types

After updating the backend, regenerate types:

```bash
# Ensure backend is running
bun run dev:backend

# Generate types
bun run api:generate
```

### Step 9: Test Your Tool

1. Create the tool via Admin UI
2. Navigate to `/tools/my-new-tool`
3. Submit a task and verify:
   - Task appears in queue
   - Worker picks up the job
   - Progress updates via SSE
   - Result saved to S3

---

## Codebase Structure

### Apps

#### `apps/funmagic-web/` - Public Web App

```
src/
├── app/                      # Next.js App Router
│   ├── [locale]/             # Locale-aware routes (next-intl)
│   │   ├── (auth)/           # Auth route group
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── tools/
│   │   │   ├── page.tsx          # Tools listing
│   │   │   ├── [slug]/page.tsx   # Fallback for unmigrated tools
│   │   │   ├── figme/            # Colocated tool route
│   │   │   │   ├── page.tsx      # Server Component
│   │   │   │   ├── actions.ts    # Colocated Server Actions
│   │   │   │   ├── figme-client.tsx
│   │   │   │   └── *.tsx         # Tool-specific components
│   │   │   ├── background-remove/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── actions.ts
│   │   │   │   └── *.tsx
│   │   │   └── crystal-memory/
│   │   │       ├── page.tsx
│   │   │       ├── actions.ts
│   │   │       └── *.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx              # Homepage
│   ├── actions/              # Shared server actions
│   │   └── tools.ts          # Shared tool actions (getTaskStatus, etc.)
│   └── globals.css
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── tools/                # Shared tool components (TaskProgressDisplay, etc.)
│   ├── upload/               # Upload components (ImagePicker, etc.)
│   ├── auth/                 # Auth forms
│   └── layout/               # Header, footer, nav
└── lib/
    ├── api.ts                # API client setup
    ├── auth-client.ts        # better-auth client
    └── utils.ts              # Utilities
```

#### `apps/funmagic-admin/` - Admin Dashboard

```
src/
├── app/
│   ├── (auth)/login/         # Admin login
│   ├── api/auth/[...all]/    # Auth API passthrough
│   ├── tools/                # Tool management
│   ├── unauthorized/         # Access denied page
│   ├── layout.tsx
│   └── page.tsx              # Dashboard
├── components/
│   ├── ui/                   # shadcn/ui components
│   └── admin/                # Admin-specific components
└── lib/
    └── ...
```

#### `apps/funmagic-backend/` - API Server

```
src/
├── index.ts                  # App entry, route mounting
├── routes/
│   ├── index.ts              # Route exports
│   ├── health.ts             # Health check endpoints
│   ├── tools.ts              # Public tool endpoints
│   ├── tasks.ts              # Task CRUD + SSE stream
│   ├── assets.ts             # Asset upload/download
│   ├── credits.ts            # Credit balance/history
│   ├── banners.ts            # Banner endpoints
│   ├── users.ts              # User endpoints
│   └── admin/
│       ├── tools.ts          # Admin tool CRUD
│       ├── tool-types.ts     # Tool type CRUD
│       ├── providers.ts      # Provider CRUD
│       └── banners.ts        # Admin banner CRUD
├── middleware/
│   └── auth.ts               # Auth middleware
├── schemas/
│   └── index.ts              # Zod schemas for API
└── lib/
    ├── queue.ts              # BullMQ job creation
    └── redis.ts              # Redis connection
```

### Packages

#### `packages/database/` - Database Layer

```
src/
├── index.ts                  # DB client + exports
└── schema/
    ├── index.ts              # Schema exports
    ├── users.ts              # users, sessions, accounts, verifications tables
    ├── tools.ts              # tools, tool_types tables
    ├── tasks.ts              # tasks, task_payloads, task_steps tables
    ├── credits.ts            # credits, credit_transactions, credit_packages tables
    ├── assets.ts             # assets table
    ├── providers.ts          # providers table
    └── banners.ts            # banners table
```

#### `packages/worker/` - Background Worker

```
src/
├── index.ts                  # BullMQ worker setup
├── types.ts                  # Worker types
├── tools/
│   ├── index.ts              # Tool registry
│   ├── figme.ts              # FigMe tool (2-step)
│   └── background-remove.ts  # Background removal
└── lib/
    ├── credentials.ts        # Provider credential decryption
    ├── progress.ts           # Redis progress publishing
    ├── redis.ts              # Redis connection
    └── storage.ts            # S3 upload utilities
```

#### `packages/services/` - Shared Business Logic

```
src/
├── index.ts                  # Service exports
├── credit.ts                 # Credit operations
├── storage.ts                # S3 operations
└── progress.ts               # Progress tracking utilities
```

#### `packages/auth/` - Authentication

```
src/
├── index.ts                  # Auth exports
├── server.ts                 # better-auth server config
├── client.ts                 # better-auth client config
└── permissions.ts            # Role-based permissions
```

#### `packages/shared/` - Shared Utilities

```
src/
├── index.ts                  # Shared exports
└── api/
    ├── index.ts              # API client factory
    └── types.ts              # Generated OpenAPI types
```

---

## Common Development Tasks

### Adding a Database Table

1. Create schema file:

```typescript
// packages/database/src/schema/my-table.ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const myTable = pgTable('my_table', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

2. Export from index:

```typescript
// packages/database/src/schema/index.ts
export * from './my-table';
```

3. Generate migration:

```bash
bun run db:generate
```

4. Apply migration:

```bash
bun run db:migrate
```

### Adding an API Endpoint

1. Create route file or add to existing:

```typescript
// apps/funmagic-backend/src/routes/my-route.ts
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

const myRoute = createRoute({
  method: 'get',
  path: '/my-endpoint',
  tags: ['MyTag'],
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ data: z.string() }) } },
      description: 'Success',
    },
  },
});

export const myRoutes = new OpenAPIHono()
  .openapi(myRoute, async (c) => {
    return c.json({ data: 'hello' });
  });
```

2. Mount in main app:

```typescript
// apps/funmagic-backend/src/index.ts
import { myRoutes } from './routes/my-route';

app.route('/api/my', myRoutes);
```

3. Regenerate types:

```bash
bun run api:generate
```

### Adding a UI Component

Follow shadcn/ui patterns:

```bash
# Add component from shadcn/ui
cd apps/funmagic-web
bunx shadcn@latest add button

# Or create custom component
# src/components/my-component.tsx
```

### Environment Variables

Add new variables to:

1. `.env.example` - Document the variable
2. `.env` - Set local value
3. `docker/docker-compose.yml` - For containerized deployment

---

## Testing

### Manual Testing

```bash
# Test specific service
bun run dev:backend   # Just backend
bun run dev:worker    # Just worker
bun run dev:web       # Just web app

# View logs
bun run infra:logs    # Infrastructure logs
```

### Database Queries

```bash
# Open Drizzle Studio
bun run db:studio

# Raw SQL via psql
docker exec -it funmagic-postgres psql -U funmagic -d funmagic
```

### API Testing

```bash
# Health check
curl http://localhost:8000/health

# API docs (OpenAPI)
curl http://localhost:8000/openapi.json
```

---

## Troubleshooting

### Common Issues

**"No worker found for tool"**
- Ensure tool slug matches worker registry key in `packages/worker/src/tools/index.ts`

**"Provider not found"**
- Verify `providerId` in tool config matches a provider UUID in database

**"No API key configured"**
- Check provider has API key set in Admin → Providers

**Worker not processing jobs**
- Check Redis connection: `bun run infra:logs` → look for redis
- Verify worker is running: `bun run dev:worker`

**SSE not working**
- Check Redis pub/sub is functioning
- Verify task ID matches between backend and worker

### Logs

```bash
# All services
bun run dev

# Individual service logs
bun run dev:backend 2>&1 | tee backend.log
bun run dev:worker 2>&1 | tee worker.log
```
