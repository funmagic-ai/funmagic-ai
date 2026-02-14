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
Landing Page -> Sign Up -> Email Verification -> Dashboard -> First Tool
```

### Steps

1. **Discover Platform** - User lands on homepage, views featured tools and banners
2. **Sign Up** - Clicks "Sign Up", enters email/password/name, submits form
3. **Email Verification** (if enabled) - Receives and clicks verification link
4. **First Experience** - Redirected to dashboard, receives initial free credits
5. **First Tool Usage** - Selects tool, uploads input, submits task, views progress, downloads result

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
5. **Activate Tool** - Toggle "Active", tool appears in public listing

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
Admin Login -> AI Studio -> New Chat -> Select Provider -> Generate Content -> Quote Images -> Continue
```

### Steps

1. **Access AI Studio** - Admin navigates to dashboard, clicks "AI Studio" in sidebar
2. **Start New Chat** - Click "New Chat", system creates session in `admin_chats` table
3. **Select Provider** - Choose from OpenAI, Google, or fal.ai
4. **Generate Content** - Enter prompt, optionally attach images, submit
5. **View Response** - AI response streams in real-time, saved to `admin_messages`
6. **Quote Images** - Click "Quote" on generated images to reference in next message
7. **Continue Conversation** - Multi-turn chat with full context, switch providers if needed

### Technical Architecture

```
Vue 3 Admin App --> Backend API --> Admin Queue --> AI Provider
       |                |                |              |
       +--- SSE <-------+----------------+--------------+

Database:
- admin_chats: Session management (id, adminId, title, model)
- admin_messages: Messages + task tracking (chatId, role, content, images, status)
```

### Features

- Multi-provider support (OpenAI, Google, fal)
- Image quotation between messages
- Model capability detection (chat-image, image-only, utility)
- Session persistence with multi-turn conversations
- Admin-specific task queue for async processing

### Permissions

| Role | AI Studio Access |
|------|------------------|
| `user` | No access |
| `admin` | Full access |
| `super_admin` | Full access + usage analytics |
