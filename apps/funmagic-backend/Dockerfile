# syntax=docker/dockerfile:1

# =============================================================================
# funmagic-backend Dockerfile
# Build Hono API server with monorepo workspace dependencies
# Usage: docker build -f apps/funmagic-backend/Dockerfile -t funmagic-backend .
# =============================================================================

FROM oven/bun:1.3.8-alpine AS base
WORKDIR /app

# -----------------------------------------------------------------------------
# Stage 1: Install dependencies
# -----------------------------------------------------------------------------
FROM base AS deps

# Copy root workspace files
COPY package.json bun.lock ./
COPY tsconfig.json ./

# Copy all package.json files for workspace resolution
COPY apps/funmagic-backend/package.json ./apps/funmagic-backend/
COPY packages/auth/package.json ./packages/auth/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/services/package.json ./packages/services/

# Install dependencies
RUN bun install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 2: Build the application
# -----------------------------------------------------------------------------
FROM base AS builder

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/funmagic-backend/node_modules ./apps/funmagic-backend/node_modules
COPY --from=deps /app/packages ./packages

# Copy source files
COPY package.json bun.lock tsconfig.json ./
COPY apps/funmagic-backend ./apps/funmagic-backend
COPY packages ./packages

# Build the application
WORKDIR /app/apps/funmagic-backend
RUN bun run build

# -----------------------------------------------------------------------------
# Stage 3: Production runner
# -----------------------------------------------------------------------------
FROM oven/bun:1.3.8-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 backend && \
    adduser --system --uid 1001 backend

# Copy built application and dependencies
COPY --from=builder /app/apps/funmagic-backend/dist ./dist
COPY --from=deps /app/node_modules ./node_modules

# Copy workspace packages (needed for runtime imports)
COPY --from=builder /app/packages ./packages

USER backend

ENV NODE_ENV=production

EXPOSE 8000
CMD ["bun", "dist/index.js"]
