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
Landing Page → Sign Up → Email Verification → Dashboard → First Tool
```

### Steps

1. **Discover Platform**
   - User lands on homepage
   - Views featured tools and banners
   - Browses tool categories

2. **Sign Up**
   - Clicks "Sign Up" in header
   - Enters email, password, name
   - Submits registration form

3. **Email Verification** (if enabled)
   - Receives verification email
   - Clicks verification link
   - Account activated

4. **First Experience**
   - Redirected to dashboard
   - Sees welcome message
   - Receives initial free credits (if configured)
   - Browses available tools

5. **First Tool Usage**
   - Selects a tool
   - Uploads/provides input
   - Submits task
   - Views real-time progress
   - Downloads result

### Technical Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Registration Flow                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐       │
│  │  /signup │────►│  POST    │────►│  Create  │────►│ Redirect │       │
│  │   Form   │     │/api/auth │     │  Session │     │  to /    │       │
│  └──────────┘     │ /sign-up │     │ + Cookie │     └──────────┘       │
│                   └──────────┘     └──────────┘                         │
│                                                                          │
│  Database Changes:                                                       │
│  - INSERT into users (id, email, name, role='user')                     │
│  - INSERT into credits (user_id, balance=initial_credits)               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Journey 2: Tool Discovery & Selection

### Flow

```
Homepage → Tools Listing → Tool Detail → (Login if needed) → Use Tool
```

### Steps

1. **Browse Tools**
   - View featured tools on homepage
   - Click "View All Tools" or category filter
   - See tool cards with thumbnails, titles, descriptions

2. **Filter & Search**
   - Filter by tool type/category
   - Search by keyword
   - Sort by popularity or date

3. **Tool Detail**
   - Click on tool card
   - View full description
   - See pricing (credits required)
   - View example outputs
   - Read usage instructions

4. **Authentication Gate**
   - If not logged in: Prompt to sign in
   - If logged in: Show usage interface

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
Tool Page → Upload Image → Submit → Progress → Result → Download
```

### Steps

1. **Access Tool**
   - Navigate to `/tools/background-remove`
   - Server Component checks if tool exists and `isActive`
   - If inactive → 404 page
   - View tool description and pricing
   - See credit balance

2. **Upload Input**
   - Click upload area
   - Select image file
   - Preview image
   - File stored in state (not uploaded yet)

3. **Submit Task**
   - Click "Remove Background"
   - Frontend uploads to S3 via `useSubmitUpload` hook → gets `storageKey`
   - Frontend calls colocated Server Action with `imageStorageKey`
   - Server Action calls `POST /api/tasks` with credentials

4. **Real-time Progress**
   - `useTaskProgress` hook connects to `GET /api/tasks/{id}/stream` (SSE)
   - Receives progress events:
     - `connected`
     - `step_started` ("Removing Background")
     - `progress` (10%, 20%, ... 100%)
     - `completed` (with output)

5. **View Result**
   - Result image displayed
   - Before/after comparison slider
   - Download button enabled

6. **Download/Save**
   - Click "Download"
   - Get presigned URL from result output
   - Browser downloads file

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│             Colocated Tool Route Structure                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  app/[locale]/tools/background-remove/                           │
│  ├── page.tsx              # Server Component                    │
│  │   └── Checks tool.isActive, fetches localized content         │
│  ├── actions.ts            # Colocated Server Actions            │
│  │   └── createTaskAction() - hardcoded toolSlug                 │
│  ├── background-remove-client.tsx  # Client Component            │
│  │   └── useSubmitUpload, useTaskProgress hooks                  │
│  └── before-after-comparison.tsx   # Result display              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Technical Sequence

```
┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐
│ Client │     │Backend │     │ Redis  │     │ Worker │     │ fal.ai │
└───┬────┘     └───┬────┘     └───┬────┘     └───┬────┘     └───┬────┘
    │              │              │              │              │
    │ POST /tasks  │              │              │              │
    │─────────────►│              │              │              │
    │              │ Reserve      │              │              │
    │              │ Credits      │              │              │
    │              │──────────────│              │              │
    │              │ Add Job      │              │              │
    │              │─────────────►│              │              │
    │ {taskId}     │              │              │              │
    │◄─────────────│              │              │              │
    │              │              │              │              │
    │ GET /stream  │              │              │              │
    │─────────────►│              │              │              │
    │              │ Subscribe    │              │              │
    │              │─────────────►│              │              │
    │              │              │ Pick job     │              │
    │              │              │◄─────────────│              │
    │              │              │              │ API call     │
    │              │              │              │─────────────►│
    │              │              │ progress:20% │              │
    │ SSE:progress │◄─────────────│◄─────────────│              │
    │◄─────────────│              │              │              │
    │              │              │              │◄─────────────│
    │              │              │ completed    │              │
    │ SSE:complete │◄─────────────│◄─────────────│              │
    │◄─────────────│              │              │              │
    │              │              │              │              │
```

---

## Journey 4: Multi-Step Tool Usage (FigMe - Photo to 3D)

### Flow

```
Tool Page → Select Style → Upload Photo → Submit → Step 1 Progress →
Review Image → Generate 3D → Step 2 Progress → 3D Model → Download
```

### Steps

1. **Access Tool**
   - Navigate to `/tools/figme`
   - Server Component checks `tool.isActive`
   - View tool description (2-step process explained)
   - See individual step credit costs

2. **Select Style**
   - View admin-configured style references (anime, cartoon, etc.)
   - Each style has preview image and prompt
   - Select desired style

3. **Upload Photo**
   - Upload portrait photo via `ImagePicker`
   - File stored in state with preview
   - Click "Generate Image"

4. **Submit Step 1**
   - `useSubmitUpload` uploads to S3 → gets `storageKey`
   - Colocated `createImageTaskAction` called with:
     - `styleReferenceId`
     - `imageStorageKey`
   - `useTaskProgress` connects to SSE stream

5. **Step 1 Progress**
   - `step_started: "Image Generation"`
   - Progress updates (calling OpenAI gpt-image-1)
   - `step_completed` with generated image

6. **Review & Continue**
   - View stylized image result
   - Options: Save to Assets, Generate 3D, Start Over
   - Click "Generate 3D"

7. **Submit Step 2**
   - Colocated `create3DTaskAction` called with:
     - `parentTaskId: <step1-task-id>`
     - `sourceAssetId`
     - `sourceImageUrl`
   - New SSE stream connected

8. **Step 2 Progress**
   - `step_started: "3D Model Generation"`
   - Progress updates (calling Tripo API)
   - `step_completed` with 3D model

9. **Final Result**
   - 3D model download available (GLB format)
   - Download button
   - "Create New" to restart

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                FigMe Colocated Route Structure                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  app/[locale]/tools/figme/                                       │
│  ├── page.tsx              # Server Component                    │
│  │   └── Fetches tool + locale, checks isActive                 │
│  ├── actions.ts            # Colocated Server Actions            │
│  │   ├── createImageTaskAction()  - stepId: 'image-gen'         │
│  │   └── create3DTaskAction()     - stepId: '3d-gen'            │
│  ├── figme-client.tsx      # Client Component with state machine│
│  ├── style-selector.tsx    # Style reference grid               │
│  ├── result-display.tsx    # Image result + action buttons      │
│  └── three-d-viewer.tsx    # 3D model viewer + download         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### User Journey State Machine

```
┌───────────────────────────────────────────────────────────────────────┐
│                        FigMe Step States                                │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────┐    ┌────────────┐    ┌───────────────┐              │
│  │ select-style │───►│upload-image│───►│generating-image│              │
│  └──────────────┘    └────────────┘    └───────┬───────┘              │
│                                                 │                      │
│       ┌─────────────────────────────────────────┘                      │
│       ▼                                                                │
│  ┌──────────────┐    ┌───────────────┐    ┌────────────┐              │
│  │ image-result │───►│ generating-3d │───►│  3d-result │              │
│  └──────────────┘    └───────────────┘    └────────────┘              │
│       │                                                                │
│       └─── Save to Assets / Start Over                                 │
│                                                                        │
└───────────────────────────────────────────────────────────────────────┘
```

### State Machine

```
┌───────────────────────────────────────────────────────────────────────┐
│                        Multi-Step Task States                          │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────┐    ┌─────────────┐    ┌────────────┐    ┌───────────┐   │
│  │  Idle   │───►│ Step 1      │───►│ Step 1     │───►│ Waiting   │   │
│  │         │    │ Processing  │    │ Complete   │    │ for User  │   │
│  └─────────┘    └─────────────┘    └────────────┘    └─────┬─────┘   │
│       ▲                                                     │         │
│       │                                                     ▼         │
│       │         ┌─────────────┐    ┌────────────┐    ┌───────────┐   │
│       └─────────│   Failed    │◄───│ Step 2     │◄───│ Step 2    │   │
│                 │             │    │ Complete   │    │ Processing│   │
│                 └─────────────┘    └────────────┘    └───────────┘   │
│                                                                        │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Journey 4b: Two-Step Pipeline Tool (Crystal Memory - Photo to 3D Point Cloud)

### Flow

```
Tool Page → Upload Photo → Auto: Background Remove → Auto: VGGT → Point Cloud Viewer
```

### Steps

1. **Access Tool**
   - Navigate to `/tools/crystal-memory`
   - Server Component checks `tool.isActive`
   - View tool description (automatic 2-step pipeline)
   - See total credit cost (step 1 + step 2)

2. **Upload Photo**
   - Upload image with clear subject
   - Works best with objects that have distinct edges
   - File stored in state with preview

3. **Submit (Triggers Pipeline)**
   - Click "Create 3D Point Cloud"
   - `useSubmitUpload` uploads to S3 → gets `storageKey`
   - `createBgRemoveTaskAction` starts step 1
   - Step indicator shows progress

4. **Step 1: Background Removal (Automatic)**
   - Progress: "Removing Background"
   - Uses fal.ai background removal
   - On complete: Automatically triggers step 2

5. **Step 2: VGGT Point Cloud (Automatic)**
   - Progress: "Generating 3D Point Cloud"
   - Uses VGGT model via Replicate
   - Generates point cloud data with colors and confidence

6. **View Result**
   - Interactive 3D point cloud viewer (Three.js)
   - Controls:
     - Rotate with mouse
     - Zoom with scroll
     - Pan with right-click
     - Point size slider
     - Confidence threshold filter
     - Auto-rotate toggle

7. **Download**
   - Download as PLY format
   - Compatible with 3D software (Blender, MeshLab)

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│            Crystal Memory Colocated Route Structure               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  app/[locale]/tools/crystal-memory/                              │
│  ├── page.tsx              # Server Component                    │
│  ├── actions.ts            # Colocated Server Actions            │
│  │   ├── createBgRemoveTaskAction() - stepId: 'background-remove'│
│  │   └── createVGGTTaskAction()     - stepId: 'vggt'            │
│  ├── crystal-memory-client.tsx  # Client with auto-pipeline     │
│  └── point-cloud-viewer.tsx     # Three.js point cloud render   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Pipeline Flow (Automatic)

```
┌─────────────────────────────────────────────────────────────────┐
│                  Automatic Pipeline Execution                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Upload    ┌──────────────┐    ┌─────────────┐    ┌──────────┐  │
│  Image ───►│ BG Remove    │───►│   VGGT      │───►│ 3D View  │  │
│            │ (5 credits)  │    │ (15 credits)│    │ + PLY    │  │
│            └──────────────┘    └─────────────┘    └──────────┘  │
│                  │                    │                          │
│                  │  On step 1 complete,                          │
│                  │  automatically triggers step 2                │
│                  │  with bgRemovedImageUrl                       │
│                  └────────────────────┘                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Journey 5: Credit Purchase

### Flow

```
Dashboard → Buy Credits → Select Package → Payment → Credits Added
```

### Steps

1. **View Balance**
   - Dashboard shows current credit balance
   - Warning if balance low
   - "Buy Credits" button visible

2. **Select Package**
   - View credit packages with pricing
   - See bonus credits for larger packages
   - Select desired package

3. **Checkout** (future)
   - Redirect to payment provider (Stripe)
   - Enter payment details
   - Confirm purchase

4. **Credits Added**
   - Payment webhook received
   - Credits added to balance
   - Transaction recorded
   - Confirmation shown

### Credit Transaction

```sql
-- When credits are purchased
INSERT INTO credit_transactions (
  user_id, type, amount, balance_after, description
) VALUES (
  'user-uuid', 'purchase', 100, 150, 'Purchased 100 credits'
);

UPDATE credits
SET balance = balance + 100,
    lifetime_purchased = lifetime_purchased + 100
WHERE user_id = 'user-uuid';
```

---

## Journey 6: Asset Management

### Flow

```
Dashboard → My Assets → View Asset → Download/Delete/Publish
```

### Steps

1. **Access Assets**
   - Navigate to dashboard
   - Click "My Assets" or asset section
   - View asset gallery

2. **Filter Assets**
   - Filter by module (tool that created it)
   - Sort by date
   - Search by filename

3. **Asset Actions**
   - **View**: Click to see full-size preview
   - **Download**: Get presigned URL, download file
   - **Publish**: Make asset publicly accessible
   - **Delete**: Soft delete (can be recovered)

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
Admin Login → Dashboard → Tools → Create/Edit Tool → Configure → Activate
```

### Steps

1. **Admin Access**
   - Navigate to admin app (`/admin`)
   - Login with admin credentials
   - Redirected to admin dashboard

2. **View Tools**
   - See all tools (active and inactive)
   - View usage statistics
   - Quick toggle active/featured status

3. **Create New Tool**
   - Click "Add Tool"
   - Fill in basic info:
     - Slug, title, description
     - Select tool type
     - Upload thumbnail
   - Configure tool:
     - Add steps with provider/model
     - Set credit costs
     - Add style references (if applicable)
   - Save as inactive

4. **Test Tool**
   - Keep tool inactive
   - Test via internal URL
   - Verify worker processes correctly
   - Check credit deduction

5. **Activate Tool**
   - Toggle "Active" switch
   - Tool appears in public listing
   - Optionally mark as "Featured"

### Admin Permissions

| Role | Permissions |
|------|-------------|
| `admin` | View/edit tools, providers, banners |
| `super_admin` | All above + user management, system config |

---

## Journey 8: Error Recovery

### Scenario: Task Fails During Processing

```
Submit Task → Processing → Error → Credits Refunded → Retry Option
```

### Steps

1. **Task Submitted**
   - Credits reserved (not yet spent)
   - Task status: `pending` → `processing`

2. **Error Occurs**
   - Worker encounters error (API failure, timeout, etc.)
   - Worker publishes `failed` event

3. **Error Handling**
   - Task status: `failed`
   - Credits released (not spent)
   - Error message stored in `task_payloads.error`

4. **User Notification**
   - SSE sends `failed` event with error message
   - UI shows error state
   - "Retry" button available

5. **Retry**
   - User clicks "Retry"
   - New task created (fresh credits reserved)
   - Process restarts

### Credit Safety

```
┌────────────────────────────────────────────────────────────────┐
│                    Credit Safety Guarantee                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Credits RESERVED when task submitted                        │
│  2. Task processing begins                                      │
│  3a. Success → Credits CONFIRMED (spent)                        │
│  3b. Failure → Credits RELEASED (not spent)                     │
│                                                                 │
│  User never loses credits on failed tasks                       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Journey 9: SSE Connection Handling

### Scenario: Connection Lost During Processing

### Steps

1. **Connection Established**
   - User submits task
   - SSE stream opened
   - Receiving progress updates

2. **Connection Lost**
   - Network issue, tab backgrounded, etc.
   - SSE stream disconnects

3. **Reconnection**
   - Client detects disconnect
   - Automatic reconnect attempt
   - New SSE stream opened

4. **State Recovery**
   - Client calls `GET /api/tasks/{id}` for current state
   - If `completed`: Show result
   - If `processing`: Resume SSE stream
   - If `failed`: Show error

### Client Implementation

```typescript
// Pseudocode for SSE handling
function subscribeToTask(taskId: string) {
  const eventSource = new EventSource(`/api/tasks/${taskId}/stream`);

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleProgressEvent(data);
  };

  eventSource.onerror = async () => {
    eventSource.close();
    // Check final state
    const task = await fetchTask(taskId);
    if (task.status === 'completed') {
      handleComplete(task);
    } else if (task.status === 'processing') {
      // Reconnect
      setTimeout(() => subscribeToTask(taskId), 1000);
    } else {
      handleError(task);
    }
  };
}
```

---

## Journey 10: First-Time Admin Setup

### Flow

```
Install → Seed DB → Create Super Admin → Configure Providers → Add Tools
```

### Steps

1. **Deploy Application**
   - Deploy all services
   - Run database migrations

2. **Create Super Admin**
   - Use CLI or seed script
   - Or: Register via app, manually update role in DB

3. **Configure Providers**
   - Add AI providers (OpenAI, fal.ai, Tripo, etc.)
   - Enter API keys (stored encrypted)
   - Test health check

4. **Create Tool Types**
   - Add categories: "Image Generation", "3D Generation", etc.
   - Set icons and colors

5. **Create Tools**
   - Create tool records
   - Link to providers via config
   - Add style references if needed

6. **Configure Banners**
   - Add promotional banners
   - Set display schedule
   - Configure links

7. **Activate & Launch**
   - Toggle tools to active
   - Mark featured tools
   - Platform ready for users
