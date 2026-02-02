# Funmagic Web - Cache Design

## Cache Profiles

### Custom Profile (`next.config.ts`)

```ts
cacheLife: {
  tools: {
    stale: 60,        // 1 minute - serve stale while revalidating
    revalidate: 300,  // 5 minutes - background refresh interval
    expire: 3600,     // 1 hour - hard expiration
  },
}
```

### Built-in Profiles

| Profile | Stale | Revalidate | Expire |
|---------|-------|------------|--------|
| `hours` | 5 min | 1 hour | 1 day |
| `days` | 5 min | 1 day | 1 week |
| `default` | 5 min | 15 min | 1 year |

---

## Cache Configuration by Query

| Query | File | Profile | Stale | Revalidate | Expire | Tags |
|-------|------|---------|-------|------------|--------|------|
| `getTools()` | `queries/tools.ts` | `tools` | 1 min | 5 min | 1 hour | `tools-list` |
| `getHomepageData()` | `queries/homepage.ts` | `tools` | 1 min | 5 min | 1 hour | `homepage`, `tools-list` |
| `getFeaturedTools()` | `queries/homepage.ts` | `tools` | 1 min | 5 min | 1 hour | `featured-tools` |
| `getCreditPackages()` | `queries/credits.ts` | `hours` | 5 min | 1 hour | 1 day | `credit-packages` |

---

## Page Rendering Strategy

| Page | Pattern | Cached at Build? | Notes |
|------|---------|------------------|-------|
| `/` (Homepage) | `'use cache'` | ✅ Yes | Requires DB at build time |
| `/tools` | `Suspense` + `connection()` | ❌ No | Runtime only |
| `/tools/[slug]` | `Suspense` + `connection()` | ❌ No | Runtime only |
| `/pricing` | `Suspense` + `connection()` | ❌ No | Runtime only |
| `/assets` | `Suspense` + `connection()` | ❌ No | Runtime only, user-specific |
| `/profile` | `Suspense` + `connection()` | ❌ No | Runtime only, user-specific |

---

## Revalidation Design

### Current Implementation

User-specific cache invalidation in Server Actions:

| Action | Revalidates |
|--------|-------------|
| `createFigMeImageTaskAction` | `user-credits-{userId}` |
| `createFigMe3DTaskAction` | `user-credits-{userId}`, `user-assets-{userId}` |
| `createBackgroundRemoveTaskAction` | `user-credits-{userId}` |
| `createCrystalMemoryBgRemoveAction` | `user-credits-{userId}` |
| `createCrystalMemoryVGGTAction` | `user-credits-{userId}`, `user-assets-{userId}` |
| `saveTaskOutputAction` | `user-assets-{userId}` |
| `deleteAssetAction` | `user-assets-{userId}` |
| `publishAssetAction` | `user-assets-{userId}` |

### Public Cache Tags (No Manual Revalidation)

These caches rely on automatic time-based revalidation:

| Tag | Auto-Revalidate |
|-----|-----------------|
| `tools-list` | Every 5 min |
| `homepage` | Every 5 min |
| `featured-tools` | Every 5 min |
| `credit-packages` | Every 1 hour |

### Future: Admin Revalidation API

To enable instant cache invalidation from admin dashboard:

```ts
// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache'

export async function POST(request: Request) {
  const { tag, secret } = await request.json()

  if (secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  revalidateTag(tag)
  return Response.json({ revalidated: true, tag })
}
```

Usage from admin:
```bash
curl -X POST https://funmagic.ai/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"tag": "tools-list", "secret": "xxx"}'
```

---

## Cache Behavior Explained

### Stale-While-Revalidate Flow

```
Request 1 (t=0):    [Cache MISS] → Fetch → Store → Return (slow)
Request 2 (t=30s):  [Cache HIT]  → Return cached (fast)
Request 3 (t=90s):  [STALE]      → Return cached + Background refresh
Request 4 (t=91s):  [Cache HIT]  → Return fresh data (fast)
...
Request N (t=65m):  [EXPIRED]    → Fetch → Store → Return (slow)
```

### Key Patterns

1. **Build-time cache (`'use cache'` without `connection()`):**
   - Executes at build time
   - Requires database access during build
   - Good for: Homepage, static content

2. **Runtime-only (`Suspense` + `connection()`):**
   - Skips build-time execution
   - Fetches on first request
   - Good for: Dynamic routes, user-specific data

3. **Cached at runtime (`Suspense` + `connection()` + `'use cache'`):**
   - Skips build-time execution
   - Caches after first request
   - Good for: Dynamic routes that benefit from caching
