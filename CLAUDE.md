# Claude Code Instructions

## Package Manager & Runtime

**Always use Bun** as the package manager and runtime for this project.

- Use `bun` instead of `npm`, `yarn`, or `pnpm`
- Use `bun run` instead of `npm run`
- Use `bun add` instead of `npm install`
- Use `bunx` instead of `npx`

## Local Documentation (llmtxt)

**Before using web search**, always check the `llmtxt/` folder for local documentation.

### Lookup Priority

1. **First**: Check `llmtxt/` folder for relevant `*.txt` or `*.md` files
2. **Second**: Check project skills (`nextjs-caching`, etc.)
3. **Last**: Use web search only if local docs don't have the answer

### How to Use

```bash
# List available documentation
ls llmtxt/

# Read specific component docs
cat llmtxt/<component-name>.txt
```

### File Naming Convention

- `llmtxt/<library-name>.txt` - Library documentation
- `llmtxt/<component-name>.txt` - Component API reference
- `llmtxt/<topic>.txt` - Topic-specific guides

### When to Check llmtxt/
- Looking up component APIs or props
- Checking library usage patterns
- Finding configuration examples
- Understanding project-specific conventions

## Required Skills

Always use the following skills when working on funmagic-web and funmagic-admin project:

### nextjs-caching

Use the `nextjs-caching` skill for any caching-related work:

- When implementing `'use cache'` directive
- When configuring `cacheLife()` profiles
- When setting up `cacheTag()` for invalidation
- When using `connection()` for dynamic rendering
- When working with `revalidatePath()`, `revalidateTag()`, or `updateTag()`
- When mixing static and dynamic components (Partial Prerendering)
- When troubleshooting build-time vs runtime execution

**Key patterns to remember:**

1. Wrap dynamic components in `<Suspense>` to defer execution to runtime
2. Use `connection()` inside Suspense to explicitly skip build-time execution
3. `'use cache'` components execute at build time unless deferred via Suspense
4. Always specify `cacheLife()` explicitly - don't rely on defaults

## Caching Quick Reference

```tsx
// Runtime-only cache pattern (no DB needed at build)
<Suspense fallback={<Loading />}>
  <DeferredCache />
</Suspense>

async function DeferredCache() {
  await connection()
  return <CachedComponent />
}

async function CachedComponent() {
  'use cache'
  cacheLife('minutes')
  cacheTag('my-data')
  // fetches only at runtime, then cached
}
```

## Commands

```bash
bun run dev      # Development
bun run build    # Production build
bun run start    # Start production server
bun add <pkg>    # Add dependency
bun add -d <pkg> # Add dev dependency
bunx <cmd>       # Run package binary
```

# State & Interaction Logic

Action Pattern: You prioritize Server Actions for mutations. In Client Components, you must use useActionState to unify the management of Loading, Error, and Data states.

Instant Feedback: For high-frequency interactions (likes, comments, etc.), you must implement useOptimistic to provide a zero-latency user experience.

URL as State: For filtering, searching, or pagination, you prioritize URL Search Params over local state to ensure SEO-friendliness and link shareability.

Minimal Side Effects: You maintain high vigilance against useEffect. Before writing one, you seek alternatives such as the use() hook, Server Actions, or component initialization logic.

# Data Synchronization (TanStack Query Integration)

Prefetch & Hydrate: For highly dynamic or social-heavy pages, you employ the RSC Prefetch + HydrationBoundary pattern to sync server-side data with the client-side TanStack Query cache.

Clear Division of Labor: You let Next.js handle the initial HTML and SEO, while delegating background refreshing, polling, and offline retries to TanStack Query.

# Engineering & Debugging

Strong Typing: You must write 100% type-safe TypeScript code, leveraging full-stack type inference to eliminate runtime bugs.

AI-Enhanced Debugging: When encountering errors, you proactively guide the user to check the Next.js DevTools MCP logs to locate issues within the underlying cache or component tree.

Native Transitions: For page transitions, you prefer the View Transitions API by configuring viewTransition: true in the router to achieve smooth, native-app-like animations.

# Output Style