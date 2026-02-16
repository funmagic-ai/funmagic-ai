# FunMagic AI - User Journeys

This document describes the key user flows through the FunMagic AI platform.

## Personas

| Persona | Description | Access Level |
|---------|-------------|--------------|
| **Visitor** | Anonymous user exploring the platform | Public pages only |
| **User** | Registered user with credits | All public features |
| **Admin** | Platform administrator | Admin dashboard |
| **Super Admin** | Full platform access | All features + system config |

---

## Journey 1: New User Registration

### Flow

```
Landing Page -> Sign Up (Email or Social OAuth) -> Dashboard -> First Tool
```

### Steps

1. **Discover Platform** - User lands on homepage, views featured tools and banners
2. **Sign Up** - User chooses one of two paths:

   **Path A: Email/Password**
   - Clicks "Sign Up", enters email/password/name, submits form
   - Email verification (if enabled) — receives and clicks verification link
   - Account created with `role: user`

   **Path B: Social OAuth (Google / Apple / Facebook)**
   - Clicks provider button (e.g., "Continue with Google")
   - Redirected to OAuth provider consent screen
   - Grants permission, redirected back to platform
   - Backend creates user + linked `accounts` record via better-auth
   - Apple Sign In requires HTTPS (does not work on localhost)

3. **First Experience** - Redirected to dashboard, receives initial free credits
4. **First Tool Usage** - Selects tool, uploads input, submits task, views progress, downloads result

### Social Login Technical Flow

```
Vue SPA                    Backend                  OAuth Provider
  │                           │                           │
  │ Click "Sign in with X"   │                           │
  │──────────────────────────>│                           │
  │                           │ Redirect to provider     │
  │<──────────────────────────│──────────────────────────>│
  │                           │                           │
  │                           │      User grants consent  │
  │                           │<──────────────────────────│
  │                           │ Create/link account       │
  │                           │ Create session            │
  │  Set-Cookie + redirect   │                           │
  │<──────────────────────────│                           │
```

Supported providers are configured in `packages/auth/src/server.ts` via better-auth's `socialProviders` option.

---

## Journey 2: Tool Discovery & Selection

### Flow

```
Homepage -> Tools Listing -> Tool Detail -> (Login if needed) -> Use Tool
```

### API Endpoints Used

| Action | Endpoint | Response |
|--------|----------|----------|
| List tools | `GET /api/tools` | Tool list with thumbnails |
| Get tool detail | `GET /api/tools/{slug}` | Full tool info + config |
| Check auth | Session cookie | User object or null |

---

## Journey 3: Single-Step Tool Usage (Background Remove)

### Flow

```
Tool Page -> Upload Image -> Submit -> Progress -> Result -> Download
```

### Steps

1. **Access Tool** - Navigate to `/tools/background-remove`, Vue router loads view
2. **Upload Input** - Select image file, preview image
3. **Submit Task** - Vue composable uploads to S3 -> gets `storageKey`, calls `POST /api/tasks`
4. **Real-time Progress** - `useTaskProgress` composable connects to SSE stream
5. **View Result** - Result image displayed with before/after comparison
6. **Download/Save** - Get presigned URL, browser downloads file

### Architecture (Vue 3)

```
apps/funmagic-web-vue3/src/
├── views/tools/
│   └── BackgroundRemoveView.vue    # Tool page component
├── composables/
│   ├── useFileUpload.ts            # S3 upload logic
│   └── useTaskProgress.ts          # SSE stream handler
└── components/tools/
    └── BeforeAfterSlider.vue       # Result display
```

### Technical Sequence

```
Client      Backend      Redis       Worker      fal.ai
  |              |           |           |           |
  | POST /tasks  |           |           |           |
  |------------>|           |           |           |
  |              | Reserve   |           |           |
  |              | Credits   |           |           |
  |              | Add Job   |           |           |
  |              |---------->|           |           |
  | {taskId}     |           |           |           |
  |<------------|           |           |           |
  |              |           |           |           |
  | GET /stream  |           |           |           |
  |------------>|           |           |           |
  |              | Subscribe |           |           |
  |              |---------->| Pick job  |           |
  |              |           |<----------|           |
  |              |           |           | API call  |
  |              |           |           |---------->|
  |              |           | progress  |           |
  | SSE:progress |<----------|<----------|           |
  |<------------|           |           |<----------|
  |              |           | completed |           |
  | SSE:complete |<----------|<----------|           |
  |<------------|           |           |           |
```

---

## Journey 4: Multi-Step Tool Usage (FigMe - Photo to 3D)

### Flow

```
Tool Page -> Select Style -> Upload Photo -> Submit -> Step 1 Progress ->
Review Image -> Generate 3D -> Step 2 Progress -> 3D Model -> Download
```

### Steps

1. **Access Tool** - Navigate to `/tools/figme`, Vue router loads FigmeView
2. **Select Style** - View admin-configured style references (anime, cartoon, etc.)
3. **Upload Photo** - Upload portrait photo, preview displayed
4. **Submit Step 1** - Upload to S3, call API with `styleReferenceId` + `imageStorageKey`
5. **Step 1 Progress** - Image generation via OpenAI
6. **Review & Continue** - View stylized image, option to generate 3D
7. **Submit Step 2** - Call API with `parentTaskId` and `sourceImageUrl`
8. **Step 2 Progress** - 3D model generation via Tripo API
9. **Final Result** - GLB format download available

### Architecture (Vue 3)

```
apps/funmagic-web-vue3/src/
├── views/tools/
│   └── FigmeView.vue           # Main tool view with state machine
├── components/tools/
│   ├── StyleSelector.vue       # Style reference grid
│   ├── ResultDisplay.vue       # Image result + action buttons
│   └── ThreeDViewer.vue        # 3D model viewer + download
```

### State Machine

```
select-style -> upload-image -> generating-image -> image-result -> generating-3d -> 3d-result
                                                        |
                                                        +-- Save to Assets / Start Over
```

---

## Journey 4b: Two-Step Pipeline (Crystal Memory - Photo to 3D Point Cloud)

### Flow

```
Tool Page -> Upload Photo -> Auto: Background Remove -> Auto: VGGT -> Point Cloud Viewer
```

### Steps

1. **Access Tool** - Navigate to `/tools/crystal-memory`
2. **Upload Photo** - Upload image with clear subject
3. **Submit** - Triggers automatic 2-step pipeline
4. **Step 1: Background Removal** - Automatic via fal.ai
5. **Step 2: VGGT Point Cloud** - Automatic via Replicate
6. **View Result** - Interactive 3D point cloud viewer (Three.js)
7. **Download** - PLY format for Blender/MeshLab

### Architecture (Vue 3)

```
apps/funmagic-web-vue3/src/
├── views/tools/
│   └── CrystalMemoryView.vue      # Main view with auto-pipeline
└── components/tools/
    └── PointCloudViewer.vue        # Three.js point cloud render
```

---

## Journey 5: Credit Purchase

### Flow

```
Dashboard -> Buy Credits -> Select Package -> Payment -> Credits Added
```

### Steps

1. **View Balance** - Dashboard shows current credit balance
2. **Select Package** - View credit packages with pricing
3. **Checkout** (future) - Stripe payment integration
4. **Credits Added** - Payment webhook received, credits added, transaction recorded

---

## Journey 6: Asset Management

### Flow

```
Dashboard -> My Assets -> View Asset -> Download/Delete/Publish
```

### Asset Visibility

| Visibility | Who Can Access | Use Case |
|------------|----------------|----------|
| `private` | Owner only | Default for all outputs |
| `public` | Anyone with URL | Published/shared assets |
| `admin-private` | Admins only | System assets |

---

## Journey 7: Admin Tool Management

### Flow

```
Admin Login -> Dashboard -> Tools -> Create/Edit Tool -> Configure -> Activate
```

### Steps

1. **Admin Access** - Navigate to Vue 3 admin app (port 3003), login
2. **View Tools** - See all tools, usage statistics, toggle active/featured
3. **Create New Tool** - Fill in slug, title, description, config JSON
4. **Test Tool** - Keep inactive, test via internal URL
5. **Configure Provider Rate Limits** (optional) - Update the provider's `config.rateLimit` via the provider update API to control throughput (`maxConcurrency`, `maxPerMinute`, `maxPerDay`)
6. **Activate Tool** - Toggle "Active", tool appears in public listing

### Admin Permissions

| Role | Permissions |
|------|-------------|
| `admin` | View/edit tools, providers, banners, AI Studio |
| `super_admin` | All above + user management, system config |

---

## Journey 8: Error Recovery

### Flow

```
Submit Task -> Processing -> Error -> Credits Refunded -> Retry Option
```

### Credit Safety

```
1. Credits RESERVED when task submitted
2. Task processing begins
3a. Success -> Credits CONFIRMED (spent)
3b. Failure -> Credits RELEASED (not spent)

User never loses credits on failed tasks
```

### Provider Rate Limit (429) Recovery

When a provider returns a 429 (rate limit exceeded) response, the system handles it transparently:

1. **Detection** - Worker catches the provider SDK error and identifies it as a 429 via `isProvider429Error()`
2. **Reschedule** - Job is rescheduled via `DelayedError` (BullMQ) — **not** counted as a task failure
3. **Exponential backoff** - Retry delays: 1s, 2s, 4s... capped at 60s
4. **Max retries** - 3 by default (configurable via `config.rateLimit.maxRetries`)
5. **Credit safety** - Credits remain reserved during retries, only released on final failure
6. **User experience** - User sees no difference — the task stays in "processing" state until it completes or exhausts retries

```
Worker → Provider API → 429 → DelayedError → re-queued → retry after backoff → Provider API → success
                                                  ↑                                     |
                                                  +--------- (if 429 again) ←-----------+
```

---

## Journey 9: SSE Connection Handling

### Scenario: Connection Lost During Processing

1. **Connection Established** - SSE stream opened, receiving progress
2. **Connection Lost** - Network issue, tab backgrounded
3. **Reconnection** - Client detects disconnect, auto-reconnects
4. **State Recovery** - Client calls `GET /api/tasks/{id}` for current state

### Vue 3 Implementation

```typescript
// Vue composable for SSE handling
import { ref, onUnmounted, watch } from 'vue'
import type { Ref } from 'vue'

export function useTaskProgress(taskId: Ref<string | null>) {
  const progress = ref(0)
  const status = ref('pending')
  let eventSource: EventSource | null = null

  function subscribe(id: string) {
    eventSource = new EventSource(`/api/tasks/${id}/stream`)
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'progress') progress.value = data.value
      if (data.type === 'completed') {
        status.value = 'completed'
        eventSource?.close()
      }
    }
    eventSource.onerror = () => {
      eventSource?.close()
      setTimeout(() => subscribe(id), 1000)
    }
  }

  watch(taskId, (id) => {
    if (id) subscribe(id)
  })

  onUnmounted(() => eventSource?.close())

  return { progress, status }
}
```

---

## Journey 10: First-Time Admin Setup

### Flow

```
Install -> Seed DB -> Create Super Admin -> Configure Providers -> Add Tools
```

### Steps

1. **Deploy** - Deploy all services including Vue 3 admin app
2. **Create Super Admin** - Use seed script or register + manually update role
3. **Configure Providers** - Add AI providers with API keys
4. **Create Tool Types** - Add categories with icons/colors
5. **Create Tools** - Create tool records, link to providers
6. **Configure Banners** - Add promotional banners
7. **Activate & Launch** - Toggle tools to active

---

## Journey 11: Admin AI Studio

### Flow

```
Admin Login -> AI Studio -> New Project -> Select Provider/Model -> Generate -> Quote Images -> Continue
                                                                        |
                                                              Batch Generation (multiple prompts)
```

### Steps

1. **Access AI Studio** - Admin navigates to dashboard, clicks "AI Studio" in sidebar
2. **Start New Project** - Click "New Project", system creates session in `studio_projects` table
3. **Select Provider & Model** - Choose provider (OpenAI, Google, fal.ai) and model, set provider-specific options:
   - **OpenAI**: Size (1024x1024, 1536x1024, etc.), quality (low/medium/high), format, background, image model
   - **Google**: Aspect ratio, image size (1K/2K/4K)
   - **fal.ai**: Tool selection (background-remove, upscale)
4. **Generate Content** - Enter prompt, optionally attach/quote images, submit
5. **Real-time Streaming** - Response streams via SSE (Redis Streams + Pub/Sub):
   - Text deltas arrive as `text_delta` events (typewriter effect)
   - Partial images arrive as `partial_image` events (progress preview)
   - Final images arrive as `image_done` events (stored in S3, referenced by `storageKey`)
6. **View Result** - Generation saved to `studio_generations` with images, content, raw request/response
7. **Quote Images** - Click "Quote" on generated images to reference in next message
8. **Continue Conversation** - Multi-turn chat with full context:
   - OpenAI: Session continuity via `openaiResponseId` stored on project
   - Google: Context reconstructed from previous generations
9. **Switch Providers** - Change provider/model mid-conversation if needed

### Batch Generation

Admins can submit multiple prompts simultaneously:

1. Enter multiple prompts (one per line or via batch interface)
2. Backend creates separate `studio_generations` records and BullMQ jobs for each
3. All jobs process concurrently (up to studio worker concurrency of 3)
4. Each generation streams progress independently to the client

### Technical Architecture

```
Vue 3 Admin App --> Backend API --> studio-tasks Queue --> Studio Worker
       |                |                  |                     |
       +--- SSE <-------+--- Redis --------+---------------------+
                    (Streams + Pub/Sub)

Database:
- studio_projects: Session management (id, adminId, title, openaiResponseId)
- studio_generations: Messages + results (projectId, role, content, images, status, rawRequest, rawResponse)
```

### Provider Workers

| Provider | Capabilities | Notes |
|----------|-------------|-------|
| OpenAI | `chat-image`, `image-only` | Uses Responses API for multi-turn; models: gpt-image-1, gpt-image-1.5 |
| Google | `chat-image` | Gemini models with image generation |
| fal.ai | `utility` | Background removal, upscaling (no conversation context) |

### Features

- Multi-provider support with provider-specific options
- Real-time SSE streaming (text deltas, partial/final images)
- Multi-turn conversations with session persistence
- Batch generation (multiple prompts in one request)
- Image quotation between messages
- Model capability detection (chat-image, image-only, utility)
- Raw request/response storage for debugging
- Per-provider rate limiting (`prl:admin:*` scope) — controls concurrency, RPM, RPD independently from web user tools

### Permissions

| Role | AI Studio Access |
|------|------------------|
| `user` | No access |
| `admin` | Full access |
| `super_admin` | Full access + usage analytics |

---

## Journey 12: Admin Rate Limit Configuration

### Flow

```
Admin Login -> Settings -> Rate Limits -> View/Update Tiers -> View/Update Category Limits -> Save
```

### Steps

1. **Access Settings** - Admin (super_admin role) navigates to Admin → Settings
2. **View Current Configuration** - See current tier definitions and per-category rate limits
3. **Edit Tiers** - Modify tier thresholds and multipliers:
   - Each tier has a `name`, `minPurchased` threshold, and `multiplier`
   - Users are automatically assigned tiers based on `credits.lifetimePurchased`
   - Example: Free (1x), Basic ($100+ → 1.5x), Premium ($500+ → 2x), VIP ($2000+ → 3x)
4. **Edit Category Limits** - Adjust base `max` for each of the 6 categories:
   - `globalApi` — IP-based ceiling on all API routes
   - `userApi` — Per-user authenticated API throughput
   - `taskCreation` — Per-user task submission rate
   - `upload` — Upload frequency
   - `authSession` — Session check rate (generous for multi-tab)
   - `authAction` — Login/signup rate (strict for brute-force protection)
5. **Save** - `PUT /api/admin/settings` updates the `rate_limit_settings` table and invalidates the Redis cache
6. **Effect** - New limits take effect within 5 minutes (Redis cache TTL) for all users

### How Tiers Apply

For per-user categories (`userApi`, `taskCreation`):
```
effective_limit = base_max * tier_multiplier
```

For IP-based categories (`globalApi`, `upload`, `authSession`, `authAction`):
```
effective_limit = base_max  (no tier multiplier)
```

### Permissions

Only `super_admin` can modify rate limit settings.

---

## Journey 13: Admin Provider Management

### Flow

```
Admin Login -> Providers (Web) -> Add/Edit Provider -> Set Credentials -> Configure Rate Limits
                  — or —
Admin Login -> Admin Providers (Studio) -> Add/Edit Provider -> Set Credentials -> Configure Rate Limits
```

### Two Provider Scopes

The platform maintains separate provider configurations for web user tools and admin studio tasks:

| Scope | Admin Section | Database Table | Rate Limit Redis Prefix | Used By |
|-------|--------------|----------------|------------------------|---------|
| Web | Providers | `providers` | `prl:web:{name}:*` | AI tasks worker |
| Studio | Admin Providers | `admin_providers` | `prl:admin:{name}:*` | Studio worker |

This separation allows:
- Different API keys per scope (e.g., separate OpenAI accounts for users vs admin)
- Independent rate limits (admin studio can have higher throughput)
- Independent health monitoring

### Steps

1. **Navigate to Provider Section** - Choose "Providers" (web) or "Admin Providers" (studio) in sidebar
2. **Add Provider** - Fill in:
   - Name (identifier, e.g., `openai`)
   - Display Name
   - Type
   - API Key (encrypted with AES-256-GCM before storage)
   - Base URL (optional, for custom endpoints)
3. **Configure Rate Limits** (optional) - Set `config.rateLimit` on the provider:
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
4. **Save** - Provider record created/updated, rate limit config cached in Redis (5 min TTL)
5. **Verify** - Worker picks up new provider on next job; rate limits enforced immediately after cache refresh

### Rate Limit Behavior

- **No rate limit config** — provider runs unrestricted
- **With config** — worker calls `tryAcquire()` before each API call:
  - Denied → job re-queued via `DelayedError` (transparent to user)
  - Allowed → proceeds to API call → `releaseSlot()` in finally block
- **Provider 429** — auto-retried with exponential backoff if `retryOn429: true`

### Permissions

| Role | Web Providers | Studio Providers |
|------|--------------|-----------------|
| `admin` | View/edit | View/edit |
| `super_admin` | View/edit | View/edit |
