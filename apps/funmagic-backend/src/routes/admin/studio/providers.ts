import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { db, adminProviders } from '@funmagic/database';
import { eq, and, isNotNull } from 'drizzle-orm';
import { ProvidersSchema } from './schemas';

const getProvidersRoute = createRoute({
  method: 'get',
  path: '/providers',
  tags: ['Admin - Studio'],
  responses: {
    200: {
      content: { 'application/json': { schema: ProvidersSchema } },
      description: 'Available providers based on configured API keys',
    },
  },
});

export const providersRoutes = new OpenAPIHono<{ Variables: { user: { id: string } } }>()
  .openapi(getProvidersRoute, async (c) => {
    // Query admin_providers table for active providers with API keys
    const availableProviders = await db.query.adminProviders.findMany({
      where: and(
        eq(adminProviders.isActive, true),
        isNotNull(adminProviders.apiKey),
      ),
    });

    return c.json({
      providers: {
        openai: availableProviders.some(p => p.name === 'openai'),
        google: availableProviders.some(p => p.name === 'google'),
        fal: availableProviders.some(p => p.name === 'fal'),
      },
    }, 200);
  });
