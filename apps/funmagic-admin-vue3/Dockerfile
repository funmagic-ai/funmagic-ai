# syntax=docker/dockerfile:1

# =============================================================================
# funmagic-admin-vue3 Dockerfile
# Build Vue3 Admin SPA with Vite and serve with nginx
# Usage: docker build -f apps/funmagic-admin-vue3/Dockerfile -t funmagic-admin-vue3 .
# =============================================================================

FROM oven/bun:1.3.8-alpine AS base
WORKDIR /app

# -----------------------------------------------------------------------------
# Stage 1: Build the application
# -----------------------------------------------------------------------------
FROM base AS builder

# Build-time environment variables
ARG VITE_API_URL=https://api.funmagic.ai
ARG VITE_APP_URL=https://admin.funmagic.ai

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_URL=$VITE_APP_URL

# Copy root workspace files
COPY package.json bun.lock ./
COPY tsconfig.json ./

# Copy source files
COPY apps/funmagic-admin-vue3 ./apps/funmagic-admin-vue3
COPY packages/shared ./packages/shared

# Install dependencies
RUN bun install

# Build the application
WORKDIR /app/apps/funmagic-admin-vue3
RUN bun run build

# -----------------------------------------------------------------------------
# Stage 2: Production server with nginx
# -----------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

# Copy nginx configuration
COPY apps/funmagic-admin-vue3/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/apps/funmagic-admin-vue3/dist /usr/share/nginx/html

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3003/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
