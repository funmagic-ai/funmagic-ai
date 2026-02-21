import 'dotenv/config';

import { validateEnv, BACKEND_REQUIRED_ENV } from './lib/env';
validateEnv([...BACKEND_REQUIRED_ENV]);

import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

import { requireAuth, requireAdmin } from './middleware/auth';
import { requestId } from './middleware/request-id';
import { httpMetrics } from './middleware/metrics';
import { securityHeaders } from './middleware/security-headers';
import {
  globalApiRateLimit,
  userApiRateLimit,
  taskCreationRateLimit,
  authSessionRateLimit,
  authActionRateLimit,
  uploadRateLimit,
} from './middleware/rate-limit';
import { auth } from '@funmagic/auth/server';
import { createLogger } from '@funmagic/services';
import { AppError, ERROR_CODES } from '@funmagic/shared';

const log = createLogger('Backend');

// Environment variables
const CORS_ORIGINS = process.env.CORS_ORIGINS!.split(',');
import { metricsRoutes } from './routes/metrics';
import { healthRoutes } from './routes/health';
import { usersRoutes } from './routes/users';
import { toolsRoutes } from './routes/tools';
import { tasksRoutes } from './routes/tasks';
import { creditsRoutes, creditsPublicRoutes } from './routes/credits';
import { bannersPublicRoutes, bannersAdminRoutes } from './routes/banners';
import { assetsRoutes } from './routes/assets';
import { streamRoutes } from './routes/stream';
import { toolTypesRoutes, toolsAdminRoutes, providersRoutes, adminProvidersRoutes, packagesRoutes, usersRoutes as usersAdminRoutes, studioRoutes, adminTasksRoutes, settingsRoutes, queueRoutes } from './routes/admin';

const app = new OpenAPIHono();

// Middleware
app.use('*', requestId);
app.use('*', httpMetrics);
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', securityHeaders);
app.use('*', cors({
  origin: CORS_ORIGINS,
  credentials: true,
}));

// Rate limiting — Layer 1: IP-based ceiling on all API routes
app.use('/api/*', globalApiRateLimit);
// Auth: split session checks (generous) vs auth actions (strict)
app.use('/api/auth/get-session', authSessionRateLimit);
app.use('/api/auth/sign-in/*', authActionRateLimit);
app.use('/api/auth/sign-up/*', authActionRateLimit);

// =====================================
// Auth routes (Better Auth handler)
// =====================================
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// =====================================
// Metrics endpoint (Prometheus scraping)
// =====================================
app.route('/metrics', metricsRoutes);

// =====================================
// Public routes (no auth required)
// =====================================
app.route('/health', healthRoutes);
app.route('/api/tools', toolsRoutes);       // List active tools, get by slug
app.route('/api/banners', bannersPublicRoutes);  // List active banners
app.route('/api/credits', creditsPublicRoutes);  // List credit packages

// =====================================
// Protected routes (authenticated users)
// =====================================
const protectedApp = new OpenAPIHono();
protectedApp.use('*', requireAuth);
// Layer 2: per-user rate limits on authenticated routes
protectedApp.use('*', userApiRateLimit);

protectedApp.route('/users', usersRoutes);
// Layer 3: strict per-user limit on task creation
protectedApp.use('/tasks', taskCreationRateLimit);
protectedApp.route('/tasks', tasksRoutes);
protectedApp.route('/credits', creditsRoutes);
protectedApp.use('/assets/upload', uploadRateLimit);
protectedApp.route('/assets', assetsRoutes);
protectedApp.route('/stream', streamRoutes);

app.route('/api', protectedApp);

// =====================================
// Admin routes (admin/super_admin only)
// =====================================
const adminApp = new OpenAPIHono();
adminApp.use('*', requireAuth);
adminApp.use('*', requireAdmin);

adminApp.route('/banners', bannersAdminRoutes);
adminApp.route('/tools', toolsAdminRoutes);
adminApp.route('/tool-types', toolTypesRoutes);
adminApp.route('/providers', providersRoutes);
adminApp.route('/admin-providers', adminProvidersRoutes);
adminApp.route('/packages', packagesRoutes);
adminApp.route('/users', usersAdminRoutes);
adminApp.route('/studio', studioRoutes);
adminApp.route('/tasks', adminTasksRoutes);
adminApp.route('/settings', settingsRoutes);
adminApp.route('/queue', queueRoutes);

app.route('/api/admin', adminApp);

// OpenAPI documentation UI endpoint
app.doc('/doc', {
  openapi: '3.1.0',
  info: {
    version: '1.0.0',
    title: 'FunMagic API',
    description: 'AI-powered tools API',
  },
});

// OpenAPI JSON spec endpoint
app.get('/openapi.json', (c) => {
  return c.json(app.getOpenAPI31Document({
    openapi: '3.1.0',
    info: {
      version: '1.0.0',
      title: 'FunMagic API',
      description: 'AI-powered tools API',
    },
  }));
});

// 404 handler
app.notFound((c) => {
  return c.json({
    error: { code: ERROR_CODES.NOT_FOUND, message: 'Not Found' },
  }, 404);
});

// Global error handler
app.onError((err, c) => {
  const reqId = c.get('requestId' as never) as string | undefined;
  const errLog = reqId ? log.child({ requestId: reqId }) : log;

  // Known application errors — log at warn level
  if (err instanceof AppError) {
    errLog.warn({ err, code: err.code, details: err.details }, err.message);
    return c.json(err.toJSON(), err.statusCode as 400);
  }

  // Zod validation errors from @hono/zod-openapi
  if (err.name === 'ZodError' && 'issues' in err) {
    const issues = (err as unknown as { issues: { message: string }[] }).issues;
    const message = issues.map((i) => i.message).join('; ');
    errLog.warn({ err }, 'Validation error');
    return c.json({
      error: { code: ERROR_CODES.VALIDATION_ERROR, message },
    }, 400);
  }

  // Unknown errors — log at error level with full stack, return safe message
  errLog.error({ err }, 'Unhandled error');
  return c.json({
    error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Internal Server Error' },
  }, 500);
});

const port = Number(process.env.PORT!);
log.info({ port }, 'Server running');

// Export app type for type inference
export type AppType = typeof app;

export default {
  port,
  fetch: app.fetch,
  // Bun.serve default idleTimeout is 10s — too short for SSE streams.
  // Set to 30s to give normal API connections reasonable cleanup while
  // SSE connections stay alive via 6s heartbeat (each write resets the timer).
  // Bun has no per-request timeout API so this is the only lever available.
  idleTimeout: 30,
};
