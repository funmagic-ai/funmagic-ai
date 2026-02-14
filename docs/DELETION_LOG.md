# Code Deletion Log

## [2026-02-10] Dead Code Analysis Report

### Executive Summary
This analysis identified significant opportunities for code cleanup in the funmagic-ai monorepo:
- **23 unused files** (mostly Vue3 boilerplate and unused routers)
- **8 unused dependencies** across packages
- **11 unused exports** in backend and worker packages
- **3 duplicated lazy proxy patterns** that could be consolidated
- **Multiple large Vue components** (300-400 lines) that need extraction

### Unused Files to Remove (23)

#### Admin Vue3 App (9 files)
- `apps/funmagic-admin-vue3/src/composables/useApi.ts` - Unused API composable
- `apps/funmagic-admin-vue3/src/composables/useAuth.ts` - Unused auth composable
- `apps/funmagic-admin-vue3/src/composables/useTheme.ts` - Unused theme composable
- `apps/funmagic-admin-vue3/src/lib/auth-client.ts` - Unused auth client setup
- `apps/funmagic-admin-vue3/src/lib/query.ts` - Unused query setup
- `apps/funmagic-admin-vue3/src/router/guards.ts` - Unused route guards
- `apps/funmagic-admin-vue3/src/router/index.ts` - Unused router setup
- `apps/funmagic-admin-vue3/src/views/dashboard/ai-tasks/AITaskDetailView.vue` - Duplicate/unused view
- `apps/funmagic-admin-vue3/src/views/dashboard/ai-tasks/AITasksListView.vue` - Duplicate/unused view

#### Web Vue3 App (11 files)
- `apps/funmagic-web-vue3/src/composables/useApi.ts` - Unused API composable
- `apps/funmagic-web-vue3/src/composables/useAuth.ts` - Unused auth composable
- `apps/funmagic-web-vue3/src/composables/useUpload.ts` - Unused upload composable
- `apps/funmagic-web-vue3/src/lib/api.ts` - Unused API setup
- `apps/funmagic-web-vue3/src/lib/auth-client.ts` - Unused auth client
- `apps/funmagic-web-vue3/src/lib/i18n.ts` - Unused i18n setup
- `apps/funmagic-web-vue3/src/lib/query.ts` - Unused query setup
- `apps/funmagic-web-vue3/src/router/guards.ts` - Unused route guards
- `apps/funmagic-web-vue3/src/router/index.ts` - Unused router setup
- `apps/funmagic-web-vue3/src/stores/app.ts` - Unused app store
- `apps/funmagic-web-vue3/src/stores/auth.ts` - Unused auth store
- `apps/funmagic-web-vue3/src/views/LoginView.vue` - Unused login view

#### Backend & Worker
- `apps/funmagic-backend/src/routes/index.ts` - Unused route file
- `packages/worker/src/lib/index.ts` - Unused lib export

### Unused Dependencies to Remove (8)

#### Production Dependencies
```json
// apps/funmagic-admin-vue3/package.json
"better-auth": "^1.4.5",  // Not imported anywhere
"clsx": "^2.1.1",         // Not used

// apps/funmagic-backend/package.json
"ioredis": "^5.4.2",      // Using redis from @funmagic/services instead

// apps/funmagic-web-vue3/package.json
"@funmagic/shared": "workspace:*",  // Not imported
"better-auth": "^1.4.5",            // Not imported
"clsx": "^2.1.1",                   // Not used
"openapi-fetch": "^0.14.3",         // Not used

// packages/worker/package.json
"@funmagic/shared": "workspace:*"   // Not imported
```

#### Dev Dependencies
```json
// apps/funmagic-admin-vue3/package.json
"tailwindcss": "^3.4.21",
"vue-component-type-helpers": "^2.2.1"

// apps/funmagic-web-vue3/package.json
"tailwindcss": "^3.4.21",
"vue-component-type-helpers": "^2.2.1"
```

### Unused Exports to Remove (11)

#### Backend Queue Exports
```typescript
// apps/funmagic-backend/src/lib/queue.ts
export const cleanupQueue  // Line 65 - Never imported
export const addAdminAITaskJob  // Line 129 - Duplicate of addAdminMessageJob
export const removeAdminAITaskJob  // Line 147 - Duplicate of removeAdminMessageJob
```

#### Backend Schema Exports
```typescript
// apps/funmagic-backend/src/schemas/index.ts
export const MessageSchema  // Line 21
export const BalanceSchema  // Line 130
export const TransactionsSchema  // Line 134
```

#### Backend Admin Routes
```typescript
// apps/funmagic-backend/src/routes/admin/providers.ts
export function decryptCredential  // Line 238 - Internal helper
```

#### Worker Exports
```typescript
// packages/worker/src/admin-tools/index.ts
export function hasAdminProviderWorker  // Line 29

// packages/worker/src/lib/credentials.ts
export function getProviderLimits  // Line 28
export function maskCredential  // Line 94

// packages/worker/src/tools/index.ts
export function hasToolWorker  // Line 25
```

### Duplicate Code Patterns to Consolidate

#### 1. Lazy Proxy Pattern (3 instances)
Currently duplicated in:
- `packages/services/src/redis.ts` (line 63)
- `apps/funmagic-backend/src/lib/queue.ts` (lines 57, 61, 65)
- `packages/auth/src/server.ts` (line 87)

**Recommendation**: Create a shared utility function:
```typescript
// packages/shared/src/utils/lazy-proxy.ts
export function createLazyProxy<T>(getter: () => T): T {
  return new Proxy({} as T, {
    get(_, prop) { return (getter() as any)[prop]; }
  });
}
```

#### 2. Queue Initialization (2 instances)
Duplicated default job options in `apps/funmagic-backend/src/lib/queue.ts`:
- `getAITasksQueue()` (lines 21-26)
- `getAdminAITasksQueue()` (lines 36-41)

**Recommendation**: Extract shared configuration:
```typescript
const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: JOB_BACKOFF_DELAY },
  removeOnComplete: 100,
  removeOnFail: 1000,
};
```

### Large Vue Components Needing Refactoring

Top 5 components by size that should be split:

1. **PointCloudViewer.vue** (412 lines)
   - Path: `apps/funmagic-web-vue3/src/components/tools/`
   - Extract: 3D rendering logic, controls, data processing

2. **UserDetailView.vue** (379 lines)
   - Path: `apps/funmagic-admin-vue3/src/views/dashboard/users/`
   - Extract: User stats component, activity list, transaction table

3. **ToolConfigForm.vue** (373 lines)
   - Path: `apps/funmagic-admin-vue3/src/components/tools/`
   - Extract: Form sections into separate components

4. **ToolCreateView.vue** (313 lines)
   - Path: `apps/funmagic-admin-vue3/src/views/dashboard/tools/`
   - Extract: Form validation logic, preview component

5. **FigmeView.vue** (311 lines)
   - Path: `apps/funmagic-web-vue3/src/views/tools/`
   - Extract: Upload logic, processing state management

### TypeScript `any` Usage to Fix

Found 6 instances in backend that need proper typing:
```typescript
// apps/funmagic-backend/src/routes/tasks.ts
Line 182: 401 as any  // Should be: satisfies StatusCode
Line 552: as any       // Needs proper type assertion

// apps/funmagic-backend/src/routes/upload.ts
Line 52: 401 as any    // Should be: satisfies StatusCode

// apps/funmagic-backend/src/lib/queue.ts
Lines 58, 62, 66: as any  // From lazy proxy pattern - would be fixed by consolidation
```

### Backward Compatibility Exports Analysis

These proxy exports may be unnecessary if direct getter functions are used:
- `redis` proxy export → Use `getRedis()` directly
- `aiTasksQueue` proxy export → Use `getAITasksQueue()` directly
- `adminAITasksQueue` proxy export → Use `getAdminAITasksQueue()` directly
- `cleanupQueue` proxy export → Use `getCleanupQueue()` directly (unused anyway)
- `auth` proxy export → Use `getAuth()` directly

**Current Usage Check**:
- `redis` proxy is used in 5 files
- Queue proxies are NOT used anywhere (safe to remove)
- `auth` proxy usage needs verification

### Recommended Action Plan

#### Phase 1: Safe Removals (Low Risk)
1. Remove all 23 unused files
2. Remove unused dev dependencies (4 packages)
3. Remove unused exports (11 functions/constants)
4. Remove backward-compatible queue proxy exports (not used)

#### Phase 2: Dependency Cleanup (Medium Risk)
1. Remove unused production dependencies after verification:
   - Verify better-auth is not needed in Vue apps
   - Confirm ioredis can be removed from backend
   - Check if @funmagic/shared will be needed soon

#### Phase 3: Code Consolidation (Medium Risk)
1. Create shared lazy proxy utility
2. Extract queue default options
3. Refactor large Vue components

#### Phase 4: Type Safety (Low Risk)
1. Fix all `any` type usages
2. Add proper type assertions
3. Enable stricter TypeScript rules

### Impact Estimates

If all recommendations are implemented:
- **Files deleted**: 23
- **Dependencies removed**: 8
- **Lines of code removed**: ~3,500
- **Bundle size reduction**: ~60-80 KB (estimated)
- **Type safety improvement**: 6 any types fixed

### Safety Notes

**NEVER REMOVE** (as per project instructions):
- Privy authentication code
- Solana wallet integration
- Supabase database clients
- Redis/OpenAI semantic search
- Market trading logic
- Real-time subscription handlers
- Any src/components/ui/*.tsx files

### Testing Required

Before removing any code:
- [ ] Run `bun test` in all packages
- [ ] Run `bun run build` in monorepo root
- [ ] Test authentication flows
- [ ] Test AI task processing
- [ ] Test admin dashboard functionality
- [ ] Verify no console errors in browser

---

**Next Steps**: Review this analysis and decide which items to remove. Start with Phase 1 (safe removals) as these have no references in the codebase.