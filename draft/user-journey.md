# FunMagic User Journey

## 1. Authentication

### Magic Link (Primary)

```
User → Enter email → Click "Send Magic Link" →
Email received (10-min expiry) → Click link → Authenticated → Redirect to home
```

### Email/Password

```
Register: Enter email/password → Verification email → Confirm → Authenticated
Login: Enter email/password → Authenticated
Reset: Forgot password → Email with reset link → New password → Login
```

### OAuth

- Click Google/Facebook/Apple button
- Authorize with provider
- Redirect back authenticated

### Roles

- `user` - Standard user (default)
- `admin` - Platform administrator
- `super_admin` - Full system control

---

## 2. User Journeys

### Homepage (`/`)

- Hero carousel (banners from admin)
- Featured tools grid (8 tools)
- Category filter chips
- "View All" → Tool catalog

### Tool Catalog (`/tools`)

- Full tool listing
- Filter by category (tool types)
- Sort: Popular, Newest, Top Rated
- Tool cards: thumbnail, title, rating, pricing badge

### Tool Detail (`/tools/[slug]`)

- Hero: Image, title, description
- Features list
- CTAs: "Use Tool", "Bookmark", "Share"
- **Pricing displayed on action buttons** (e.g., "Generate (20 credits)")
  - Single-step tools: credits configured on tool
  - Multi-step tools: credits configured per step, shown on each step button

**Unauthenticated Tool Access:**

When user clicks "Use Tool" without being logged in:

1. Show shadcn/ui Dialog component for seamless login
2. Options: Magic Link, OAuth (Google, Facebook, Apple)
3. After login, automatically redirect back to tool execution

### Tool Execution (Authenticated)

```
1. Configure inputs (prompts, settings)
2. Select image (if required):
   - ImagePicker shows local preview
   - No upload yet (file stored in browser memory)
3. Click "Generate" / "Create"
4. Upload phase (if image selected):
   - File uploaded to S3 via presigned URL
   - Asset record created in database
   - Progress shown: "Uploading..."
5. Credits reserved from balance
6. Task created (pending) with assetId reference
7. Job queued in BullMQ
8. Real-time progress via SSE:
   - Processing indicator
   - Progress percentage (if available)
   - Step-by-step progress for multi-step tools
9. Task completed → Results displayed
10. Credits confirmed (charged)
11. Output asset created → Download/Save option
```

**Key UX Pattern:** Submit-time upload - files are only uploaded when the user clicks Generate, not when they select a file. This allows users to change their mind without wasting bandwidth.

### Assets (`/assets`)

- Gallery grid of generated content
- Filter by type (image, 3D)
- Filter by tool used

**Related Tasks Panel:**

- List of user's tasks with real-time progress (SSE)
- Status badge (pending/processing/completed/failed)
- Progress percentage for active tasks

**Asset Display:**

- For images: Show output thumbnail
- For 3D outputs: Show input image from final generation round

**Actions:** Download, Delete, Re-run

**Metadata:** Created date, tool name, size

### Profile (`/profile`)

- Display name, email
- Credit balance with "Buy Credits" button
- Settings:
  - Theme (light/dark)
  - Language selector
  - Accent color

---

## 3. Admin Journeys

### Dashboard Home (`/dashboard`)

**Stats Cards:**

- Total Users
- Active Tasks
- Credits Used (lifetime)
- Revenue (month)

**Recent Transactions Table:**

- Type badge (purchase/usage/refund)
- Description
- Amount (green +, red -)
- Timestamp

### User Management (`/dashboard/users`)

**List View:**

- Name (clickable)
- Email
- Role badge
- Credit balance
- Created date

**User Detail:**

- Full profile
- Credit history
- Task history
- Role management

### Tool Management (`/dashboard/tools`)

**List View:**

- Title + slug
- Tool type
- Status badges (Active/Featured)
- Usage count

**Actions:**

- Toggle active/inactive
- Toggle featured
- Edit tool configuration

### Task Monitoring (`/dashboard/tasks`)

**Filters:** All | Pending | Queued | Processing | Completed | Failed

**Table:**

- User (clickable)
- Tool (clickable)
- Status badge
- Credits charged
- Duration
- Created date

**Task Detail:**

- Full input/output JSON
- Provider request/response
- Error message (if failed)
- Provider metadata (tokens, latency)

### Billing (`/dashboard/billing`)

**Revenue Stats:**

- Monthly revenue
- Lifetime revenue

**Credit Packages:**

- Name, credits, bonus
- Price, currency
- Stripe product ID
- Active/Popular flags

**Transactions:**

- Paginated history
- All transaction types
- Amount changes

### Provider Config (`/dashboard/providers`)

**List:**

- Name, type
- Health status (green/red)
- Last health check

**Edit:**

- API key (encrypted) - Primary authentication credential
- Base URL (optional) - Override default provider endpoint
- Config JSON - Provider-specific settings:
  - Additional credentials (e.g., `appId`, `secretId`, `secretKey` for providers requiring multiple auth fields)
  - Model-specific parameters
  - Rate limit overrides
  - Custom headers

### Tool Types (`/dashboard/tool-types`)

- Name, display name
- Sort order
- Active status

### Content (`/dashboard/content`)

- Banner management
- Scheduling (start/end dates)
- Type (main/side)
- Position ordering

---

## 4. Credit System

### Balance Calculation

```typescript
Available = balance - reservedBalance
```

### Transaction Flow

```
Purchase:    User buys → Stripe webhook → addCredits(purchase)
Task Start:  reserveCredits() → balance stays, reserved increases
Task Success: confirmCharge() → reserved decreases, usage logged
Task Fail:   releaseCredits() → reserved decreases, release logged
Refund:      refundCredits() → balance increases, refund logged
```

### Transaction Types

| Type | Direction | Trigger |
|------|-----------|---------|
| `purchase` | + | Stripe payment |
| `bonus` | + | Admin/promotion |
| `welcome` | + | New user signup |
| `reservation` | (hold) | Task start |
| `release` | (unhold) | Task failure |
| `usage` | - | Task success |
| `refund` | + | Admin action |
| `admin_adjust` | ± | Admin manual |

---

## 5. Task Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                        TASK LIFECYCLE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────┐    ┌────────┐    ┌────────────┐    ┌───────────┐  │
│   │ pending │───▶│ queued │───▶│ processing │───▶│ completed │  │
│   └─────────┘    └────────┘    └────────────┘    └───────────┘  │
│        │                             │                           │
│        │ credits reserved            │ credits confirmed         │
│        │ task created                │ asset created             │
│        │                             │                           │
│        │                             ▼                           │
│        │                        ┌────────┐                       │
│        │                        │ failed │                       │
│        │                        └────────┘                       │
│        │                             │                           │
│        │                             │ credits released          │
│        │                             │ error logged              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### State Details

| State | Description | Actions |
|-------|-------------|---------|
| `pending` | Task created, credits reserved | Waiting for queue |
| `queued` | Added to BullMQ queue | Waiting for worker |
| `processing` | Worker executing AI call | SSE progress updates |
| `completed` | Success, output saved | Credits confirmed, asset created |
| `failed` | Error occurred | Credits released, error logged |

---

## 6. Real-time Updates (SSE)

### Endpoint

`GET /api/tasks/[id]/stream`

### Event Types

```typescript
{ type: 'connected', taskId }            // Connection established
{ type: 'step_started', stepId, taskId } // Step began
{ type: 'progress', stepId, progress }   // Progress update (0-100)
{ type: 'partial_result', stepId, data } // Streaming partial result
{ type: 'step_completed', stepId, output } // Step finished
{ type: 'step_failed', stepId, error }   // Step failed
```

### Implementation

- Redis pub/sub for progress broadcasting
- 30-second heartbeat keepalive
- Auto-close on task completion

---

## 7. Storage Flow Diagrams

### User Upload Flow (Submit-Time Upload)

```
┌──────────────────────────────────────────────────────────────────┐
│  PHASE 1: File Selection (No Network)                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   User selects file ──▶ ImagePicker ──▶ Local preview shown     │
│                         (blob URL)       File in browser memory  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  PHASE 2: Upload on Submit (User clicks "Generate")              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐   POST /api/upload     ┌──────────┐                │
│  │  Browser │  (file metadata)       │   API    │                │
│  │          │ ─────────────────────▶ │  Server  │                │
│  └──────────┘                        └────┬─────┘                │
│       │                                    │                      │
│       │                                    │ 1. Auth (onBeforeUpload)
│       │                                    │ 2. Generate storage key
│       │                                    │ 3. Create asset record
│       │                                    │ 4. Generate presigned URL
│       │                                    ▼                      │
│       │   { presignedUrl, metadata }  ┌──────────┐                │
│       │ ◀──────────────────────────── │ Response │                │
│       │   (assetId in metadata)       └──────────┘                │
│       │                                                           │
│       │   PUT presignedUrl (binary)   ┌──────────┐                │
│       └──────────────────────────────▶│   MinIO  │                │
│                                        │   / S3   │                │
│                                        └──────────┘                │
│                                                                   │
│   Result: { objectKey, assetId } returned to app                 │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Components:**
- `ImagePicker` - Local preview component (no network)
- `useSubmitUpload` hook - Triggers upload on demand via `@better-upload`

### AI Generation Flow

```
┌──────────┐    Execute Task       ┌──────────┐
│   Queue  │ ───────────────────▶ │   AI     │
│  (Redis) │                       │  Worker  │
└──────────┘                       └────┬─────┘
                                        │
     ┌──────────────────────────────────┘
     │
     ▼
┌──────────┐    Call Provider      ┌──────────┐
│  Worker  │ ───────────────────▶ │  OpenAI  │
│          │                       │/Replicate│
└──────────┘                       └────┬─────┘
     │                                   │
     │   { url: "https://..." }          │
     │ ◀─────────────────────────────────┘
     │
     │   1. Fetch from provider URL
     │   2. Upload to private bucket
     │   3. Create asset record
     ▼
┌──────────┐
│   MinIO  │
│   / S3   │
└──────────┘
```

### Publish Flow

```
┌──────────────┐                    ┌──────────────┐
│   PRIVATE    │   copyFile()       │    PUBLIC    │
│    BUCKET    │ ─────────────────▶ │    BUCKET    │
│              │                    │              │
│ {userId}/    │   deleteFile()     │ shared/      │
│  ai_gen/     │ ◀─ ─ ─ ─ ─ ─ ─ ─ ─ │  {userId}/   │
│   file.png   │   (after copy)     │   {postId}/  │
│              │                    │    file.png  │
└──────────────┘                    └──────────────┘

Visibility: private → public
Access: User-only → Anonymous CDN
```

---

## 8. Purchase Flow

### Credit Package Purchase

```
1. User clicks "Buy Credits" on profile
2. Select credit package (e.g., "100 Credits - $9.99")
3. Redirect to Stripe Checkout
4. Complete payment
5. Stripe webhook fires (checkout.session.completed)
6. System adds credits via addCredits(purchase)
7. User redirected to success page with updated balance
```

### Stripe Billing Portal

```
1. User clicks "Manage Billing" in profile
2. System creates portal session via createPortalSession()
3. Redirect to Stripe Customer Portal
4. User can view invoices, update payment methods
5. Return to app via configured return URL
```

---

## 9. Error Handling

### Task Failures

| Error Type | User Message | System Action |
|------------|--------------|---------------|
| Provider timeout | "AI service timed out. Credits refunded." | Release credits, log error |
| Provider error | "AI service error. Please try again." | Release credits, log error |
| Invalid input | "Invalid input. Please check your settings." | No credit charge |
| Insufficient credits | "Not enough credits. Please purchase more." | Block task creation |
| Rate limit | "Too many requests. Please wait." | Block with retry-after |

### Circuit Breaker States

| State | Behavior |
|-------|----------|
| Closed | Normal operation, requests pass through |
| Open | All requests fail fast (provider unhealthy) |
| Half-Open | Test requests to check recovery |

---

## 10. Request Chain Flow

This section documents what happens when a user clicks on a page or performs an action, showing the complete chain from browser to database.

### Page Load: Tool Catalog (`/tools`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. BROWSER REQUEST                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   User clicks "/tools" link                                                 │
│        │                                                                     │
│        ▼                                                                     │
│   Next.js Router resolves → /[locale]/tools/page.tsx                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  2. SERVER COMPONENT EXECUTION                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   page.tsx (Server Component)                                               │
│        │                                                                     │
│        ├─ await params → { locale: "en" }                                   │
│        ├─ setRequestLocale(locale)                                          │
│        ├─ getTranslations()                                                 │
│        │                                                                     │
│        └─ getTools() → calls toolService.getActiveTools()                   │
│                │                                                             │
│                ▼                                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  3. SERVICE LAYER (with Redis Cache)                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   toolService.getActiveTools()                                              │
│        │                                                                     │
│        ├─ Check Redis cache: GET "tools:active"                             │
│        │                                                                     │
│        ├─ CACHE HIT? ──────────────────────────────────────┐                │
│        │   Yes: Return JSON.parse(cached)                   │                │
│        │                                                    ▼                │
│        │                                        ┌──────────────────┐        │
│        │                                        │   Return Tools   │        │
│        │                                        └──────────────────┘        │
│        │                                                                     │
│        └─ CACHE MISS? ─────────────────────────────────────┐                │
│            │                                                │                │
│            ▼                                                │                │
│   Query PostgreSQL via Drizzle:                            │                │
│   db.query.tools.findMany({                                │                │
│     where: eq(tools.isActive, true),                       │                │
│     with: { toolType: true },                              │                │
│     orderBy: desc(tools.usageCount)                        │                │
│   })                                                        │                │
│            │                                                │                │
│            ▼                                                │                │
│   Store in Redis: SETEX "tools:active" 300 <json>          │                │
│            │                                                │                │
│            └────────────────────────────────────────────────┘                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  4. RENDER & RESPONSE                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   page.tsx receives tools array                                             │
│        │                                                                     │
│        ├─ Map to ToolCard props                                             │
│        ├─ Render Server Component HTML                                      │
│        │                                                                     │
│        ▼                                                                     │
│   Response: HTML with tool grid                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Timing (typical):**

| Step | Cache Hit | Cache Miss |
|------|-----------|------------|
| Router resolution | ~1ms | ~1ms |
| Service layer | ~2ms | ~15-30ms |
| Render | ~5ms | ~5ms |
| **Total** | **~8ms** | **~35ms** |

---

### Page Load: Tool Detail (`/tools/[slug]`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  REQUEST CHAIN                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   User clicks tool card → /en/tools/background-remove                       │
│        │                                                                     │
│        ▼                                                                     │
│   Next.js Router                                                            │
│   ├─ Pattern match: /[locale]/tools/[slug]                                  │
│   └─ Params: { locale: "en", slug: "background-remove" }                    │
│        │                                                                     │
│        ▼                                                                     │
│   page.tsx (Server Component)                                               │
│   ├─ generateMetadata() → toolService.getToolBySlug(slug)                   │
│   └─ ToolPage() → toolService.getToolBySlug(slug)                           │
│        │                                                                     │
│        ▼                                                                     │
│   toolService.getToolBySlug("background-remove")                            │
│   ├─ Redis GET "tool:slug:background-remove"                                │
│   │                                                                          │
│   ├─ HIT: Return cached tool with toolType                                  │
│   │                                                                          │
│   └─ MISS:                                                                  │
│       ├─ PostgreSQL: SELECT * FROM tools                                    │
│       │              WHERE slug = $1 AND is_active = true                   │
│       │              WITH toolType                                          │
│       ├─ Redis SETEX "tool:slug:background-remove" 300 <json>               │
│       └─ Redis SETEX "tool:id:{id}" 300 <json>  (cross-cache)               │
│        │                                                                     │
│        ▼                                                                     │
│   Render: Tool header + ToolExecutor client component                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Admin Mutation: Update Tool

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MUTATION CHAIN (Cache Invalidation)                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Admin clicks "Save" on tool edit form                                     │
│        │                                                                     │
│        ▼                                                                     │
│   Server Action: updateTool(id, data)                                       │
│        │                                                                     │
│        ▼                                                                     │
│   apps/admin/src/lib/services/tools.ts                                      │
│   └─ toolService.updateTool(id, data)                                       │
│        │                                                                     │
│        ▼                                                                     │
│   packages/db/src/services/tool-service.ts                                  │
│   ├─ 1. Get current tool (for old slug)                                     │
│   │      db.query.tools.findFirst({ where: eq(tools.id, id) })              │
│   │                                                                          │
│   ├─ 2. Update PostgreSQL                                                   │
│   │      db.update(tools).set(data).where(eq(tools.id, id))                 │
│   │                                                                          │
│   └─ 3. Invalidate caches                                                   │
│          ├─ DEL "tool:id:{id}"                                              │
│          ├─ DEL "tool:slug:{oldSlug}"                                       │
│          ├─ DEL "tool:slug:{newSlug}" (if changed)                          │
│          ├─ DEL "tools:active"                                              │
│          └─ DEL "tools:featured:*"                                          │
│        │                                                                     │
│        ▼                                                                     │
│   Next user request: Cache MISS → Fresh data from PostgreSQL               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Task Execution: Full Chain

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. USER CLICKS "GENERATE"                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ToolExecutor (Client Component)                                           │
│   └─ onClick → POST /api/tasks                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  2. API ROUTE: /api/tasks                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   route.ts POST handler                                                     │
│   ├─ Auth check: auth.api.getSession()                                      │
│   ├─ Validate input                                                         │
│   ├─ Get tool: toolService.getToolBySlug(slug)  ← Redis cache              │
│   ├─ Check credits: creditService.hasCredits(userId, amount)                │
│   ├─ Reserve credits: creditService.reserveCredits()                        │
│   ├─ Create task: db.insert(tasks)                                          │
│   ├─ Queue job: queueAIExecution(jobData)                                   │
│   └─ Return: { taskId, status: "pending" }                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  3. CLIENT SUBSCRIBES TO SSE                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ToolExecutor                                                              │
│   └─ new EventSource(`/api/tasks/${taskId}/stream`)                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  4. WORKER PROCESSES JOB                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ai-worker/src/index.ts                                                    │
│   ├─ Job dequeued from BullMQ                                               │
│   ├─ Update task: status = "processing"                                     │
│   ├─ Get provider: providerService.getProviderWithCredentials(id)           │
│   │                 ← Redis cache                                           │
│   ├─ Call AI provider (OpenAI, Fal, etc.)                                   │
│   ├─ Publish progress: redis.publish(`task:${taskId}`, progress)            │
│   ├─ On success:                                                            │
│   │   ├─ Upload result to S3                                                │
│   │   ├─ Create asset record                                                │
│   │   ├─ Confirm credits                                                    │
│   │   └─ Update task: status = "completed", output = { assetId, url }       │
│   └─ On failure:                                                            │
│       ├─ Release credits                                                    │
│       └─ Update task: status = "failed", error = message                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  5. SSE DELIVERS UPDATES                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   /api/tasks/[id]/stream/route.ts                                           │
│   ├─ Redis subscriber: redis.subscribe(`task:${taskId}`)                    │
│   ├─ On message: stream.write(`data: ${event}\n\n`)                         │
│   └─ Client receives: { type: "completed", output: {...} }                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Request Chain Summary

| User Action | Route | Service Layer | Cache | Database |
|-------------|-------|---------------|-------|----------|
| View tool catalog | `/[locale]/tools/page.tsx` | `toolService.getActiveTools()` | `tools:active` | `SELECT * FROM tools WHERE is_active` |
| View tool detail | `/[locale]/tools/[slug]/page.tsx` | `toolService.getToolBySlug()` | `tool:slug:{slug}` | `SELECT * FROM tools WHERE slug` |
| Execute tool | `POST /api/tasks` | `toolService.getToolBySlug()` | `tool:slug:{slug}` | Task insert, credit reservation |
| Admin update tool | Server Action | `toolService.updateTool()` | Invalidates all tool caches | `UPDATE tools SET ...` |

---

## 11. Security Considerations

### Authentication

- Session tokens stored in HTTP-only cookies
- CSRF protection via SameSite=Lax
- Rate limiting on auth endpoints

### Data Access

- User can only access own tasks, assets, credits
- Admin routes require admin/super_admin role
- API endpoints validate user ownership

### Sensitive Data

- API keys encrypted at rest (AES-256-GCM)
- Stripe secrets never exposed to client
- Presigned URLs expire after 1 hour

### File Uploads

- **Submit-time upload**: Files uploaded on form submit, not on selection
- **Local preview**: `ImagePicker` uses blob URLs for instant preview without network
- **Asset tracking**: Every upload creates an asset record in database
- **File type validation**: Images only (PNG, JPEG, WebP, GIF)
- **Size limits**: 20MB for tool inputs, 5MB for avatars, 100MB for general files
- **Direct-to-S3**: Presigned URLs bypass server (no memory pressure)
- **Library**: `@better-upload` for client/server integration


 since you already implement figme.ts and background-remove.ts these two worker, let me clarify their details, so you        
  can update worker logic, and i will imeplement funmagic-web and funmagic-admin independently.                               
  figme: we will use gpt-image-1.5 and tripo providers for two steps in this tool. we allow admin user to define the          
  provider according to tool implementation of config component(tips provider openai and ask admin user to select from        
  providers list to match, and then show model,provider options, allow user to change, allow admin user to define the         
  cost for each step). we also allow admin user to upload maximum 8 style reference images and text prompt. when web user     
   access the tool, the tool will first check the auth status, and show the reference styles images for user to select,       
  and then user upload their image, click generate(20 credits) button, the first step will create the parent task and         
  worker start to read the task and route for right provider to execute, the web tool monitor the progress no matter user     
   stay or left and come back. once the first step finished, the user can decide to save the output to the assets or          
  click 3D generation(figme button), then the child task created and the worker read the task route to right provider and     
   execute, then web tool show the progress again ,once finished we show the output in 3d scene and also allow user to        
  save assets to his own assets.                                                                                              
  for background remove worker, we actually allow admin user to simply config the price as the tool got only one step and     
   use fal.ai 'bria/background/remove' model. you may implement the worker and tools in admin and web. 