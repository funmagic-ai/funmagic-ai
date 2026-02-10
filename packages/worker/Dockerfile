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
# Stage 1: Build and run
# -----------------------------------------------------------------------------
FROM base AS runner

# Install runtime dependencies for sharp
RUN apk add --no-cache vips

WORKDIR /app

# Copy root workspace files
COPY package.json bun.lock ./
COPY tsconfig.json ./

# Copy all packages
COPY packages ./packages

# Install dependencies
RUN bun install

# Create non-root user
RUN addgroup --system --gid 1001 worker && \
    adduser --system --uid 1001 worker && \
    chown -R worker:worker /app

USER worker

ENV NODE_ENV=production

WORKDIR /app/packages/worker

CMD ["bun", "src/index.ts"]
