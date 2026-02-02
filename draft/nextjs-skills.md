# Next.js App Router Caching Skills

## Configuration

Enable caching features in `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  cacheComponents: true,
}
export default nextConfig
```

---

## Core Concepts

### The Four Caching Layers

| Layer | Location | Purpose | Duration |
|-------|----------|---------|----------|
| **Request Memoization** | Server | Dedupe identical fetches in single render | Per-request |
| **Data Cache** | Server | Store data across requests/deployments | Persistent (revalidatable) |
| **Full Route Cache** | Server | Cache HTML & RSC payload | Persistent (revalidatable) |
| **Router Cache** | Client | Reduce server requests on navigation | Session or time-based |

---

## `'use cache'` Directive

Marks routes, components, or functions as cacheable.

### File-Level
```tsx
'use cache'

export default async function Page() {
  return <div>Entire page is cached</div>
}
```

### Component-Level
```tsx
export async function MyComponent() {
  'use cache'
  return <div>This component is cached</div>
}
```

### Function-Level
```tsx
export async function getData() {
  'use cache'
  const data = await fetch('/api/data')
  return data
}
```

### Cache Key Composition
Cache entries are keyed by:
1. Build ID
2. Function ID (hash of location/signature)
3. Serializable arguments
4. Closure-captured variables

### Serialization Rules

**Supported types:**
- Primitives: `string`, `number`, `boolean`, `null`, `undefined`
- Plain objects and arrays
- Dates, Maps, Sets, TypedArrays

**Unsupported:**
- Class instances, functions, symbols, WeakMaps

### Pass-Through Pattern
Accept non-serializable values without inspecting them:

```tsx
async function CachedWrapper({ children }: { children: ReactNode }) {
  'use cache'
  // Don't read children - just pass through
  return (
    <div className="wrapper">
      <header>Cached Header</header>
      {children}
    </div>
  )
}
```

### Critical Constraint: No Runtime APIs

Cached functions **cannot access** `cookies()`, `headers()`, or `searchParams` directly.

```tsx
// WRONG
async function Cached() {
  'use cache'
  const cookieStore = cookies() // Error!
}

// CORRECT - read outside, pass as argument
export default async function Page() {
  const token = (await cookies()).get('auth')?.value
  return <Cached token={token} />
}

async function Cached({ token }: { token?: string }) {
  'use cache'
  // Use token safely here
}
```

---

## `cacheLife()` - Cache Lifetime Control

Sets how long cached content remains fresh.

### Three Timing Properties

| Property | Scope | Behavior |
|----------|-------|----------|
| `stale` | Client | How long client uses cache before server check |
| `revalidate` | Server | Background refresh interval (ISR-like) |
| `expire` | Server | Max lifetime before forced regeneration |

### Built-in Profiles

| Profile | Use Case | stale | revalidate | expire |
|---------|----------|-------|------------|--------|
| `default` | Standard content | 5 min | 15 min | 1 year |
| `seconds` | Real-time (stocks, scores) | 30 sec | 1 sec | 1 min |
| `minutes` | Frequent updates (feeds) | 5 min | 1 min | 1 hour |
| `hours` | Multi-daily (inventory) | 5 min | 1 hour | 1 day |
| `days` | Daily updates (blog) | 5 min | 1 day | 1 week |
| `weeks` | Weekly (podcasts) | 5 min | 1 week | 30 days |
| `max` | Rarely changes (legal) | 5 min | 30 days | 1 year |

### Usage

```tsx
'use cache'
import { cacheLife } from 'next/cache'

export default async function BlogPage() {
  cacheLife('days')
  const posts = await getBlogPosts()
  return <PostList posts={posts} />
}
```

### Custom Profiles

Define in `next.config.ts`:

```ts
const nextConfig = {
  cacheComponents: true,
  cacheLife: {
    editorial: {
      stale: 600,       // 10 minutes
      revalidate: 3600, // 1 hour
      expire: 86400,    // 1 day
    },
  },
}
```

Use in components:

```tsx
'use cache'
import { cacheLife } from 'next/cache'

export async function Article() {
  cacheLife('editorial')
  // ...
}
```

### Inline Profiles

```tsx
'use cache'
import { cacheLife } from 'next/cache'

export async function Page() {
  cacheLife({
    stale: 3600,
    revalidate: 900,
    expire: 86400,
  })
  return <div>Custom cached</div>
}
```

### Conditional Cache Lifetimes

```tsx
'use cache'
import { cacheLife, cacheTag } from 'next/cache'

async function getPost(slug: string) {
  const post = await fetchPost(slug)
  cacheTag(`post-${slug}`)

  if (!post) {
    cacheLife('minutes') // Draft/missing - cache briefly
    return null
  }

  cacheLife('days') // Published - cache longer
  return post.data
}
```

---

## `cacheTag()` - Tag-Based Invalidation

Tag cached entries for selective invalidation.

### Basic Usage

```tsx
import { cacheTag } from 'next/cache'

export async function getProducts() {
  'use cache'
  cacheTag('products')
  return fetch('/api/products')
}
```

### Multiple Tags

```tsx
cacheTag('products', 'catalog', `category-${categoryId}`)
```

### Dynamic Tags

```tsx
export async function getPost(slug: string) {
  'use cache'
  const post = await fetchPost(slug)
  cacheTag('posts', `post-${slug}`, `author-${post.authorId}`)
  return post
}
```

### Constraints
- Max 256 characters per tag
- Max 128 tags per cache entry
- Must be called within `'use cache'` scope

---

## `connection()` - Force Dynamic Rendering

Signals that a component should wait for the incoming request.

```tsx
import { connection } from 'next/server'

export default async function Page() {
  await connection()
  // Everything below is excluded from prerendering
  const rand = Math.random()
  const now = new Date()
  return <div>{rand} - {now.toISOString()}</div>
}
```

### When to Use
- Component doesn't use Dynamic APIs but needs runtime rendering
- Using `Math.random()`, `new Date()`, or external data per-request
- Replacing deprecated `unstable_noStore()`

---

## Revalidation Functions

### `revalidatePath()` - Path-Based Invalidation

```tsx
import { revalidatePath } from 'next/cache'

// Specific URL
revalidatePath('/blog/post-1')

// Dynamic route pattern
revalidatePath('/blog/[slug]', 'page')

// Layout and all nested pages
revalidatePath('/blog/[slug]', 'layout')

// All data (use sparingly)
revalidatePath('/', 'layout')
```

**Context:** Server Actions, Route Handlers

### `revalidateTag()` - Tag-Based Invalidation

```tsx
import { revalidateTag } from 'next/cache'

// Stale-while-revalidate (recommended)
revalidateTag('posts', 'max')

// Immediate expiration (webhooks)
revalidateTag('posts', { expire: 0 })
```

**Context:** Server Actions, Route Handlers

### `updateTag()` - Immediate Invalidation

```tsx
import { updateTag } from 'next/cache'

// Server Actions ONLY
export async function createPost() {
  await db.post.create(...)
  updateTag('posts') // Waits for fresh data
}
```

### Comparison

| Function | Behavior | Context |
|----------|----------|---------|
| `revalidateTag()` | Stale-while-revalidate | Actions + Handlers |
| `updateTag()` | Wait for fresh data | Actions only |
| `revalidatePath()` | Invalidate by path | Actions + Handlers |

---

## Best Practices

### 1. Always Specify `cacheLife`

```tsx
// GOOD - explicit behavior
'use cache'
cacheLife('hours')

// AVOID - implicit default (can be confusing)
'use cache'
// uses 'default' profile implicitly
```

### 2. Read Runtime Data Outside Cache Scope

```tsx
// Pattern: Read outside, pass as argument
export default async function Page() {
  const userId = (await cookies()).get('userId')?.value
  return <CachedDashboard userId={userId} />
}

async function CachedDashboard({ userId }: { userId?: string }) {
  'use cache'
  cacheLife('minutes')
  cacheTag(`user-${userId}`)
  return <Dashboard userId={userId} />
}
```

### 3. Use Pass-Through for Children

```tsx
async function CachedLayout({ children }: { children: ReactNode }) {
  'use cache'
  cacheLife('hours')
  const nav = await getNavigation()
  return (
    <div>
      <Nav items={nav} />
      {children} {/* Dynamic content passes through */}
    </div>
  )
}
```

### 4. Tag Related Data Together

```tsx
async function getPost(id: string) {
  'use cache'
  cacheTag('posts', `post-${id}`)
  // ...
}

async function getComments(postId: string) {
  'use cache'
  cacheTag('comments', `post-${postId}-comments`)
  // ...
}

// Invalidate post and its comments together
export async function updatePost(id: string) {
  await db.post.update(...)
  updateTag(`post-${id}`)
  updateTag(`post-${id}-comments`)
}
```

### 5. Use Appropriate Revalidation Strategy

```tsx
// Server Action - use updateTag for read-your-own-writes
'use server'
export async function submitComment(postId: string, data: FormData) {
  await db.comment.create(...)
  updateTag(`post-${postId}-comments`) // See your comment immediately
  redirect(`/posts/${postId}`)
}

// Webhook/Route Handler - use revalidateTag
export async function POST(req: Request) {
  const { postId } = await req.json()
  revalidateTag(`post-${postId}`, 'max') // Stale-while-revalidate
  return Response.json({ ok: true })
}
```

### 6. Hybrid Static + Dynamic Rendering

```tsx
import { Suspense } from 'react'

export default async function Page() {
  return (
    <div>
      {/* Cached content */}
      <CachedHeader />
      <CachedSidebar />

      {/* Dynamic content wrapped in Suspense */}
      <Suspense fallback={<Skeleton />}>
        <DynamicContent />
      </Suspense>
    </div>
  )
}

async function CachedHeader() {
  'use cache'
  cacheLife('days')
  return <header>...</header>
}

async function DynamicContent() {
  await connection() // Force dynamic
  const user = await getCurrentUser()
  return <UserDashboard user={user} />
}
```

---

## Partial Prerendering (PPR) - Mixed Static & Dynamic

When `cacheComponents: true` is enabled, Next.js uses **Partial Prerendering** - mixing static and dynamic content in the same route.

### The Problem

During `next build`, Next.js tries to prerender your pages. If a component calls `fetch()`, database queries, or runtime APIs without proper handling, the build will:
1. Execute that code at build time
2. Fail if the API/database is unavailable
3. Cache stale data from build time

### The Solution: `<Suspense>` Boundaries

**Key insight:** Next.js stops prerendering at `<Suspense>` boundaries. Code inside Suspense is NOT executed during build - it's deferred to request time.

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <>
      {/* This IS prerendered at build time */}
      <StaticHeader />

      {/* This is NOT executed at build time */}
      {/* The fallback becomes part of static shell */}
      <Suspense fallback={<Loading />}>
        <DynamicComponent />
      </Suspense>
    </>
  )
}
```

### Complete Pattern: Mixed Components

```tsx
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { connection } from 'next/server'
import { cacheLife } from 'next/cache'

export default function Page() {
  return (
    <div>
      {/* STATIC: Pure JSX, no async operations */}
      <header>
        <h1>My App</h1>
        <nav>Static Navigation</nav>
      </header>

      {/* CACHED: Fetches at build, cached for reuse */}
      <CachedContent />

      {/* DYNAMIC: Deferred to request time via Suspense */}
      <Suspense fallback={<p>Loading user data...</p>}>
        <DynamicUserContent />
      </Suspense>

      {/* DYNAMIC: Another dynamic section */}
      <Suspense fallback={<p>Loading feed...</p>}>
        <PersonalizedFeed />
      </Suspense>
    </div>
  )
}

// CACHED COMPONENT
// Executed once at build, result cached
async function CachedContent() {
  'use cache'
  cacheLife('hours')

  const posts = await fetch('https://api.example.com/posts')
  return <PostList posts={await posts.json()} />
}

// DYNAMIC COMPONENT - uses connection()
// NOT executed at build time due to Suspense wrapper
async function DynamicUserContent() {
  await connection() // Explicitly defer to request time

  const now = new Date()
  const random = Math.random()
  return <div>Generated at {now.toISOString()}</div>
}

// DYNAMIC COMPONENT - uses cookies()
// NOT executed at build time due to Suspense wrapper
async function PersonalizedFeed() {
  const userId = (await cookies()).get('userId')?.value

  if (!userId) {
    return <div>Please log in</div>
  }

  // This fetch only runs at request time
  const feed = await fetch(`https://api.example.com/feed/${userId}`)
  return <Feed data={await feed.json()} />
}
```

### Build Output

```
Route (app)                    Size     First Load JS
┌ ○ /                          5.2 kB   92 kB
│   ├ ◐ CachedContent          (cached)
│   └ ƒ DynamicUserContent     (dynamic)
│   └ ƒ PersonalizedFeed       (dynamic)
```

- `○` = Static shell (prerendered)
- `◐` = Cached component (prerendered, revalidatable)
- `ƒ` = Dynamic (streams at request time)

### What Gets Prerendered vs Deferred

| Component Type | Build Behavior | Runtime Behavior |
|----------------|----------------|------------------|
| Pure JSX (no async) | Prerendered | Served from static shell |
| `'use cache'` component | Executed & cached at build | Served from cache |
| Inside `<Suspense>` with `connection()` | **Skipped** | Executed per request |
| Inside `<Suspense>` with `cookies()`/`headers()` | **Skipped** | Executed per request |
| Inside `<Suspense>` with `fetch()` (no cache) | **Skipped** | Executed per request |

### Error Without Suspense

If dynamic code is NOT wrapped in Suspense:

```
Error: Uncached data was accessed outside of <Suspense>
```

### Nested Suspense for Parallel Loading

```tsx
export default function Page() {
  return (
    <div>
      <CachedHeader />

      {/* These stream independently in parallel */}
      <div className="grid grid-cols-2">
        <Suspense fallback={<Skeleton />}>
          <UserProfile />
        </Suspense>

        <Suspense fallback={<Skeleton />}>
          <UserActivity />
        </Suspense>
      </div>

      <Suspense fallback={<Skeleton />}>
        <RecommendedContent />
      </Suspense>
    </div>
  )
}
```

### Combining Cache with Runtime Data

When you need cached data that varies by user:

```tsx
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <PersonalizedCached />
    </Suspense>
  )
}

// Step 1: Read runtime data (inside Suspense, so deferred)
async function PersonalizedCached() {
  const userId = (await cookies()).get('userId')?.value
  return <CachedByUser userId={userId} />
}

// Step 2: Cache per-user (userId becomes cache key)
async function CachedByUser({ userId }: { userId?: string }) {
  'use cache'
  cacheLife('minutes')
  cacheTag(`user-${userId}`)

  // This is cached per userId
  const data = await fetchUserDashboard(userId)
  return <Dashboard data={data} />
}
```

### Summary: Avoiding Build-Time Execution

| Goal | Solution |
|------|----------|
| Skip fetch at build | Wrap component in `<Suspense>` |
| Skip DB query at build | Wrap component in `<Suspense>` |
| Use cookies/headers | Wrap in `<Suspense>`, access inside |
| Use Math.random/Date | Use `connection()` + `<Suspense>` |
| Cache but defer to runtime | `<Suspense>` + read runtime data + pass to cached component |

---

## Does `'use cache'` Require Database During Build?

**Yes, by default.** Components with `'use cache'` execute at build time and their results are cached into the static shell. If your database/Redis is unavailable during `next build`, it will fail.

### The Problem

```tsx
// This WILL execute during `next build`
async function CachedPosts() {
  'use cache'
  cacheLife('hours')
  const posts = await db.query('SELECT * FROM posts') // ❌ Needs DB at build!
  return <PostList posts={posts} />
}
```

### Solutions

#### Solution 1: Wrap in `<Suspense>` + Use Runtime Trigger

The cached component only executes at build if it can be reached without hitting a Suspense boundary with runtime data:

```tsx
import { Suspense } from 'react'
import { connection } from 'next/server'

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <DeferredCache />
    </Suspense>
  )
}

// This makes the context dynamic - defers to runtime
async function DeferredCache() {
  await connection() // Signals: "wait for request"
  return <CachedPosts />
}

// This caches at RUNTIME, not build time
async function CachedPosts() {
  'use cache'
  cacheLife('minutes')
  const posts = await db.query('SELECT * FROM posts')
  return <PostList posts={posts} />
}
```

**How it works:**
1. `<Suspense>` tells Next.js this can be deferred
2. `connection()` explicitly defers to request time
3. `CachedPosts` is never called during build
4. At runtime, the result is cached for subsequent requests 

### Complete Pattern: Runtime-Only Cache

```tsx
import { Suspense } from 'react'
import { connection } from 'next/server'
import { cacheLife, cacheTag } from 'next/cache'

export default function BlogPage() {
  return (
    <div>
      {/* Static header - prerendered */}
      <header><h1>Blog</h1></header>

      {/* Deferred to runtime, then cached */}
      <Suspense fallback={<PostsSkeleton />}>
        <RuntimeCachedPosts />
      </Suspense>
    </div>
  )
}

async function RuntimeCachedPosts() {
  await connection() // Defer to request time
  return <CachedPosts />
}

async function CachedPosts() {
  'use cache'
  cacheLife('minutes')
  cacheTag('posts')

  // This only runs at runtime, then cached
  const posts = await db.query('SELECT * FROM posts')
  return <PostList posts={posts} />
}
```

### Build vs Runtime Execution Summary

| Pattern | Executes At Build? | Requires DB at Build? |
|---------|-------------------|----------------------|
| `'use cache'` alone | ✅ Yes | ✅ Yes |
| `'use cache'` in `<Suspense>` (no runtime trigger) | ✅ Yes | ✅ Yes |
| `'use cache'` in `<Suspense>` + `connection()` | ❌ No | ❌ No |
| `'use cache'` in `<Suspense>` + `cookies()`/`headers()` | ❌ No | ❌ No |
| `'use cache: remote'` | ❌ No | ❌ No |

---

## What Triggers Dynamic Rendering

These APIs opt out of Full Route Cache:

```tsx
import { cookies, headers, connection, draftMode } from 'next/headers'

cookies()           // Reading cookies
headers()           // Reading headers
connection()        // Explicit dynamic signal
draftMode()         // Draft mode check
searchParams        // URL search params
fetch(..., { cache: 'no-store' })
```

---

## Debugging

Enable verbose cache logging:

```bash
NEXT_PRIVATE_DEBUG_CACHE=1 npm run dev
```

---

## Quick Reference

| Goal | Solution |
|------|----------|
| Cache entire page | `'use cache'` at file level |
| Cache single component | `'use cache'` inside async component |
| Cache data fetch | `'use cache'` in async function |
| Set cache duration | `cacheLife('profile')` |
| Enable selective invalidation | `cacheTag('name')` |
| Force dynamic rendering | `await connection()` |
| Invalidate by path | `revalidatePath('/path')` |
| Invalidate by tag (stale-while-revalidate) | `revalidateTag('tag', 'max')` |
| Invalidate by tag (immediate) | `updateTag('tag')` |
| Read cookies/headers with cache | Read outside cache, pass as props |
| **Skip fetch/DB at build time** | Wrap in `<Suspense>` |
| **Mix static + dynamic in one page** | PPR with `<Suspense>` boundaries |
| **Per-user cache** | `<Suspense>` → read cookie → pass to cached component |
