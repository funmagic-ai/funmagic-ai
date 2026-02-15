import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db } from '@funmagic/database';
import { getRateLimitConfig, updateRateLimitConfig } from '@funmagic/services';
import type { RateLimitConfig } from '@funmagic/database';
import { badRequest } from '../../lib/errors';
import { ERROR_CODES } from '@funmagic/shared';
import { ErrorSchema } from '../../schemas';

// Schemas
const RateLimitTierSchema = z.object({
  name: z.string().min(1),
  minPurchased: z.number().int().min(0),
  multiplier: z.number().min(0.1),
});

const RateLimitLimitEntrySchema = z.object({
  max: z.number().int().min(1),
  windowSeconds: z.number().int().min(1),
});

const RateLimitLimitsSchema = z.object({
  userApi: RateLimitLimitEntrySchema,
  taskCreation: RateLimitLimitEntrySchema,
  upload: RateLimitLimitEntrySchema,
  authSession: RateLimitLimitEntrySchema,
  authAction: RateLimitLimitEntrySchema,
  globalApi: RateLimitLimitEntrySchema,
});

const RateLimitConfigSchema = z.object({
  tiers: z.array(RateLimitTierSchema).min(1),
  limits: RateLimitLimitsSchema,
}).openapi('RateLimitConfig');

const RateLimitConfigResponseSchema = z.object({
  config: RateLimitConfigSchema,
}).openapi('RateLimitConfigResponse');

// Routes
const getRateLimitRoute = createRoute({
  method: 'get',
  path: '/rate-limit',
  tags: ['Admin - Settings'],
  responses: {
    200: {
      content: { 'application/json': { schema: RateLimitConfigResponseSchema } },
      description: 'Current rate limit configuration',
    },
  },
});

const updateRateLimitRoute = createRoute({
  method: 'put',
  path: '/rate-limit',
  tags: ['Admin - Settings'],
  request: {
    body: {
      content: { 'application/json': { schema: RateLimitConfigSchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: RateLimitConfigResponseSchema } },
      description: 'Updated rate limit configuration',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Invalid configuration',
    },
  },
});

export const settingsRoutes = new OpenAPIHono()
  .openapi(getRateLimitRoute, async (c) => {
    const config = await getRateLimitConfig(db);
    return c.json({ config }, 200);
  })
  .openapi(updateRateLimitRoute, async (c) => {
    const data = c.req.valid('json') as RateLimitConfig;

    // Validate tier names are unique
    const tierNames = data.tiers.map(t => t.name);
    if (new Set(tierNames).size !== tierNames.length) {
      throw badRequest(ERROR_CODES.VALIDATION_ERROR, 'Tier names must be unique');
    }

    const updated = await updateRateLimitConfig(db, data);
    return c.json({ config: updated }, 200);
  });
