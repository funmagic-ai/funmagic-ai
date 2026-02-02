# FunMagic AI - Development Guide

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) 1.3+
- Docker & Docker Compose

### First-Time Setup

```bash
# Clone and install
git clone <repo>
cd funmagic-ai
bun install

# Start infrastructure (PostgreSQL, Redis, MinIO)
bun run infra:up

# Copy environment file
cp .env.example .env

# Run database migrations
bun run db:migrate

# Start all services
bun run dev
```

### Service URLs

| Service | URL |
|---------|-----|
| Web App | http://localhost:3000 |
| Admin Panel | http://localhost:3001 |
| API Server | http://localhost:8000 |
| API Docs | http://localhost:8000/doc |
| OpenAPI Spec | http://localhost:8000/openapi.json |
| MinIO Console | http://localhost:9001 |

---

## Deployment Scenarios

### Scenario 1: Local Dev (Apps on Host)

Apps run with `bun run dev` on host machine, only infrastructure in Docker.

```bash
# Start infrastructure only
bun run infra:up

# Copy and configure environment
cp .env.example .env
# Edit .env to set SECRET_KEY and BETTER_AUTH_SECRET

# Run database migrations
bun run db:migrate

# Start all services
bun run dev
```

**`.env` file for local dev:**
```bash
# Database (connect to Docker-exposed port)
DATABASE_URL=postgres://funmagic:funmagic_dev@localhost:5432/funmagic

# Redis (connect to Docker-exposed port)
REDIS_URL=redis://localhost:6379

# S3/MinIO (connect to Docker-exposed port)
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-2
S3_ACCESS_KEY=funmagic
S3_SECRET_KEY=funmagic_dev
S3_BUCKET_PUBLIC=funmagic-public
S3_BUCKET_PRIVATE=funmagic-private
S3_BUCKET_ADMIN=funmagic-admin

# ... other vars from .env.example
```

### Scenario 2: Full Docker Stack

All services in Docker containers. Services communicate via container names.

```bash
# Start full stack
bun run stack:up
```

**Key differences:**
- Backend/Worker use container names: `postgres`, `redis`, `minio`
- Frontend SSR needs internal URL for server-side, external URL for browser

**`docker-compose.yml` environment:**
```yaml
# Backend & Worker (container → container)
backend:
  environment:
    DATABASE_URL: postgres://funmagic:funmagic_dev@postgres:5432/funmagic
    REDIS_URL: redis://redis:6379
    S3_ENDPOINT: http://minio:9000  # Internal container name
    # ... other vars

# Frontend (needs both internal and external URLs)
web:
  environment:
    # Browser fetches (client-side) - user's browser → host
    NEXT_PUBLIC_API_URL: http://localhost:8000
    # SSR fetches (server-side) - container → container
    API_URL_INTERNAL: http://backend:8000
    # Auth callback URL
    BETTER_AUTH_URL: http://localhost:3000
```

**Note:** For SSR to work correctly, Next.js code should use:
- `process.env.NEXT_PUBLIC_API_URL` for client components
- `process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL` for server components

### Network Rules

| From | To | Use |
|------|-----|-----|
| Host machine | Docker container | `localhost:{port}` |
| Container | Container (same network) | `{container_name}:{port}` |
| Browser | Docker backend | `localhost:{port}` (via host mapping) |
| Container SSR | Container backend | `{container_name}:{port}` |

---

## Storage Buckets

| Visibility | Bucket | Policy | Access Method |
|------------|--------|--------|---------------|
| `public` | `funmagic-public` | **Public download** | Direct URL (no auth) |
| `private` | `funmagic-private` | Private (default) | Presigned URL (15 min) |
| `admin-private` | `funmagic-admin` | Private (default) | Presigned URL (15 min) |

**Verification:**
1. Access MinIO console at http://localhost:9001
   - Login: `funmagic` / `funmagic_dev`
2. Verify `funmagic-public` has "public" access policy
3. Verify `funmagic-private` and `funmagic-admin` are private

**Test public asset access:**
```bash
# Upload test file
curl -X PUT "http://localhost:9000/funmagic-public/test.txt" \
  -H "Content-Type: text/plain" \
  -u "funmagic:funmagic_dev" \
  -d "Hello World"

# Access directly (no auth needed)
curl "http://localhost:9000/funmagic-public/test.txt"
```

---

## Project Structure

```
funmagic-ai/
├── apps/
│   ├── funmagic-web/       # Public Next.js app (port 3000)
│   ├── funmagic-admin/     # Admin Next.js app (port 3001)
│   └── funmagic-backend/   # Hono API server (port 8000)
├── packages/
│   ├── database/           # Drizzle ORM schema
│   ├── shared/             # Shared types & API client
│   └── worker/             # BullMQ background worker
└── docker/                 # Docker Compose files
```

---

## Common Commands

### Development
```bash
bun run dev              # Start all services
bun run dev:backend      # Backend only
bun run dev:web          # Web frontend only
bun run dev:admin        # Admin frontend only
bun run dev:worker       # Background worker only
```

### Database
```bash
bun run db:generate      # Generate migration from schema changes
bun run db:migrate       # Apply pending migrations
bun run db:push          # Push schema directly (dev only)
bun run db:studio        # Open Drizzle Studio GUI
```

### API Types
```bash
bun run api:generate     # Regenerate TypeScript types from OpenAPI
```

### Quality
```bash
bun run typecheck        # TypeScript check all packages
bun run lint             # Lint all packages
```

### Docker
```bash
bun run infra:up         # Start PostgreSQL, Redis, MinIO
bun run infra:down       # Stop infrastructure
bun run stack:up         # Start full stack in Docker
bun run stack:down       # Stop full stack
```

---

## Build & Runtime Architecture

| Environment | Runtime | node_modules in final image? |
|-------------|---------|------------------------------|
| Development | Bun (`--bun` flag) | N/A |
| Build | Node.js (via Bun) | N/A |
| Docker Production | Bun | No (standalone output) |

- **`--bun` flag**: Forces Bun runtime instead of Node.js. Used in dev for speed.
- **Docker**: Multi-stage build produces minimal image with standalone Next.js output.
- See [docs/design.md](docs/design.md) for full architecture details.

---

## Adding a New API Endpoint

### 1. Define Schema (if new types needed)

Edit `apps/funmagic-backend/src/schemas/index.ts`:

```typescript
import { z } from '@hono/zod-openapi'

export const MyNewSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
}).openapi('MyNewThing')
```

### 2. Create Route Definition

In your route file (e.g., `apps/funmagic-backend/src/routes/myroute.ts`):

```typescript
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from '@hono/zod-openapi'
import { MyNewSchema, ErrorSchema } from '../schemas'

const getMyThingRoute = createRoute({
  method: 'get',
  path: '/{id}',
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: MyNewSchema } },
      description: 'Success',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Not found',
    },
  },
})

export const myRoutes = new OpenAPIHono()
  .openapi(getMyThingRoute, async (c) => {
    const { id } = c.req.valid('param')
    // Implementation here
    return c.json({ id, name: 'Example' })
  })
```

### 3. Register Route in Main App

Edit `apps/funmagic-backend/src/index.ts`:

```typescript
import { myRoutes } from './routes/myroute'

const app = new OpenAPIHono()
  // ... existing routes
  .route('/api/my-thing', myRoutes)
```

### 4. Regenerate Frontend Types

```bash
# Ensure backend is running
bun run dev:backend &

# Generate types
bun run api:generate
```

### 5. Use in Frontend

```typescript
import { api } from '@/lib/api'

const { data, error } = await api.GET('/api/my-thing/{id}', {
  params: { path: { id: '123' } }
})
```

---

## Database Schema Changes

### 1. Edit Schema

Edit files in `packages/database/src/schema/`:

```typescript
// Example: Add new field
export const users = pgTable('users', {
  // ... existing fields
  newField: text('new_field'),  // Add this
})
```

### 2. Generate Migration

```bash
bun run db:generate
# Creates new file in packages/database/drizzle/
```

### 3. Apply Migration

```bash
bun run db:migrate
```

### 4. Verify

```bash
# Check tables
PGPASSWORD=funmagic_dev psql -h localhost -U funmagic -d funmagic -c "\dt"
```

---

## Troubleshooting

### Port already in use
```bash
# Find process
lsof -i :8000

# Kill it
kill -9 <PID>
```

### Database connection issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart infrastructure
bun run infra:down && bun run infra:up
```

### Types out of sync
```bash
# Regenerate from OpenAPI spec
bun run api:generate
```

### Clear all caches
```bash
rm -rf node_modules/.cache
rm -rf apps/*/.next
bun install
```

### MinIO bucket issues
```bash
# Check buckets
docker exec funmagic-minio mc ls local/

# Re-run init
docker compose -f docker/docker-compose.infra.yml up minio-init
```
