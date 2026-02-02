# Fix REDIS_URL for Auth in Web/Admin Services

## Problem

Both `funmagic-web` and `funmagic-admin` use server-side auth (`auth.api.getSession()`) which requires Redis for session caching. This causes:

**Local Development Error:**
```
Error: REDIS_URL environment variable is required
```

**Root Cause**: The auth module in `packages/auth/src/server.ts:35` calls `getRedis()` which requires `REDIS_URL`.

---

## Solution

### 1. Local Development Fix

Created symlinks from each Next.js app to the root `.env` file.

**Symlinks:**
```
apps/funmagic-web/.env   → ../../.env
apps/funmagic-admin/.env → ../../.env
```

**Setup commands:**
```bash
ln -sf ../../.env apps/funmagic-web/.env
ln -sf ../../.env apps/funmagic-admin/.env
```

This allows both apps to access all environment variables from the monorepo root.

### 2. Docker Deployment Fix

Updated `docker/docker-compose.yml` to add auth environment variables to both `web` and `admin` services:

**Added environment variables:**
- `DATABASE_URL` - For drizzle adapter (user/session storage)
- `REDIS_URL` - For session caching (secondaryStorage)
- `BETTER_AUTH_URL` - Points to backend service
- `BETTER_AUTH_SECRET` - Auth secret from env
- `TRUSTED_ORIGINS` - Both frontend URLs

**Added service dependencies:**
- `postgres: condition: service_healthy`
- `redis: condition: service_healthy`

---

## Files Modified

| File | Action |
|------|--------|
| `apps/funmagic-web/.env` | Symlink → `../../.env` |
| `apps/funmagic-admin/.env` | Symlink → `../../.env` |
| `docker/docker-compose.yml` | Added auth env vars to web/admin services |
| `.gitignore` | Added `apps/*/.env` to ignore symlinks |

---

## Verification

### Local Development
```bash
bun run dev:admin
```
Should start without "REDIS_URL environment variable is required" errors.

### Docker Deployment
```bash
bun run stack:rebuild
```
Then visit http://localhost:3001/dashboard - auth should work properly.

---

## Required Environment Variables for Auth

| Variable | Purpose |
|----------|---------|
| `REDIS_URL` | Session caching (secondaryStorage) |
| `DATABASE_URL` | User/session storage (drizzle adapter) |
| `BETTER_AUTH_URL` | Base URL for auth |
| `BETTER_AUTH_SECRET` | Auth secret |
| `TRUSTED_ORIGINS` | Allowed origins for CORS |
