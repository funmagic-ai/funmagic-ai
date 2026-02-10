# syntax=docker/dockerfile:1

# =============================================================================
# funmagic-worker Dockerfile
# Build BullMQ worker with monorepo workspace dependencies
# Usage: docker build -f packages/worker/Dockerfile -t funmagic-worker .
# =============================================================================

FROM oven/bun:1.3.8-alpine AS base

# Install dependencies for sharp (native image processing)
RUN apk add --no-cache \
    vips-dev \
    build-base \
    python3

WORKDIR /app

# -----------------------------------------------------------------------------
# Stage 1: Install dependencies
# -----------------------------------------------------------------------------
FROM base AS deps

# Copy root workspace files
COPY package.json bun.lock ./
COPY tsconfig.json ./

# Copy all package.json files for workspace resolution
COPY packages/worker/package.json ./packages/worker/
COPY packages/database/package.json ./packages/database/
COPY packages/services/package.json ./packages/services/
COPY packages/shared/package.json ./packages/shared/
COPY packages/auth/package.json ./packages/auth/

# Install dependencies (including native modules like sharp)
RUN bun install 

# -----------------------------------------------------------------------------
# Stage 2: Production runner
# -----------------------------------------------------------------------------
FROM oven/bun:1.3.8-alpine AS runner

# Install runtime dependencies for sharp
RUN apk add --no-cache vips

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/worker/node_modules ./packages/worker/node_modules

# Copy source files
COPY package.json bun.lock tsconfig.json ./
COPY packages ./packages

# Create non-root user
RUN addgroup --system --gid 1001 worker && \
    adduser --system --uid 1001 worker && \
    chown -R worker:worker /app

USER worker

ENV NODE_ENV=production

WORKDIR /app/packages/worker

CMD ["bun", "src/index.ts"]
