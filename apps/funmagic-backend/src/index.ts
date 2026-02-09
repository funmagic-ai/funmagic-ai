import 'dotenv/config';

import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

import { requireAuth, requireAdmin } from './middleware/auth';
import { auth } from '@funmagic/auth/server';

// Environment variables
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:3001').split(',');
import { healthRoutes } from './routes/health';
import { usersRoutes } from './routes/users';
import { toolsRoutes } from './routes/tools';
import { tasksRoutes } from './routes/tasks';
import { creditsRoutes, creditsPublicRoutes } from './routes/credits';
import { bannersPublicRoutes, bannersAdminRoutes } from './routes/banners';
import { assetsRoutes } from './routes/assets';
import { uploadRoutes } from './routes/upload';
import { toolTypesRoutes, toolsAdminRoutes, providersRoutes, adminProvidersRoutes, packagesRoutes, usersRoutes as usersAdminRoutes, aiStudioRoutes, adminTasksRoutes } from './routes/admin';

const app = new OpenAPIHono();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: CORS_ORIGINS,
  credentials: true,
}));

// =====================================
// Auth routes (Better Auth handler)
// =====================================
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

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

protectedApp.route('/users', usersRoutes);
protectedApp.route('/tasks', tasksRoutes);
protectedApp.route('/credits', creditsRoutes);
protectedApp.route('/assets', assetsRoutes);
protectedApp.route('/upload', uploadRoutes);

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
adminApp.route('/ai-studio', aiStudioRoutes);
adminApp.route('/tasks', adminTasksRoutes);

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
app.notFound((c) => c.json({ error: 'Not Found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

const port = Number(process.env.PORT) || 8000;
console.log(`[Backend] Server running at http://localhost:${port}`);

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
