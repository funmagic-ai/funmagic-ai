# Funmagic AI

AI tools platform with credit-based billing.

## Tech Stack

- **Runtime**: Bun 1.3.8
- **Frontend**: Next.js 16.1.6
- **Backend**: Hono 4.11.7
- **ORM**: Drizzle ORM 0.45.1
- **Queue**: BullMQ 5.67.2
- **Database**: PostgreSQL 18
- **Cache**: Redis 7.4

## Quick Start

### Prerequisites
- Bun 1.3.8+
- Docker Desktop

### Development

1. Install dependencies:
   ```bash
   bun install
   ```

2. Start infrastructure:
   ```bash
   bun run infra:up
   ```

3. Run migrations:
   ```bash
   bun run db:migrate
   ```

4. Start all services:
   ```bash
   bun run dev
   ```

## Project Structure

- `apps/funmagic-web` - Public Next.js app (port 3000)
- `apps/funmagic-admin` - Admin Next.js app (port 3001)
- `apps/funmagic-backend` - Hono API server (port 8000)
- `packages/database` - Drizzle ORM schema
- `packages/shared` - Shared types
- `packages/worker` - BullMQ worker
