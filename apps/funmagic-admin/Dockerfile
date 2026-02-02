# syntax=docker/dockerfile:1

# =============================================================================
# funmagic-admin Dockerfile
# Build Next.js admin app with monorepo workspace dependencies
# Usage: docker build -f apps/funmagic-admin/Dockerfile -t funmagic-admin .
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
COPY apps/funmagic-admin/package.json ./apps/funmagic-admin/
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
COPY --from=deps /app/apps/funmagic-admin/node_modules ./apps/funmagic-admin/node_modules
COPY --from=deps /app/packages ./packages

# Copy source files
COPY package.json bun.lock tsconfig.json ./
COPY apps/funmagic-admin ./apps/funmagic-admin
COPY packages ./packages

# Build arguments for environment variables needed at build time
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application
WORKDIR /app/apps/funmagic-admin
RUN bun run build

# -----------------------------------------------------------------------------
# Stage 3: Production runner
# -----------------------------------------------------------------------------
FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Copy standalone build output
COPY --from=builder /app/apps/funmagic-admin/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/funmagic-admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/funmagic-admin/.next/static ./apps/funmagic-admin/.next/static

USER nextjs

EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "apps/funmagic-admin/server.js"]
