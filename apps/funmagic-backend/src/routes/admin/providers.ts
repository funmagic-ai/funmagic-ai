import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, providers } from '@funmagic/database';
import { eq } from 'drizzle-orm';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// Environment variables
const SECRET_KEY = process.env.SECRET_KEY;
const HEALTH_CHECK_TIMEOUT = parseInt(process.env.HEALTH_CHECK_TIMEOUT_MS ?? '10000', 10);

// Encryption constants
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT = 'funmagic-salt'; // Static salt for key derivation

// Schemas
const ProviderSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  displayName: z.string(),
  description: z.string().nullable(),
  baseUrl: z.string().nullable(),
  config: z.any().nullable(),
  isActive: z.boolean(),
  healthCheckUrl: z.string().nullable(),
  lastHealthCheckAt: z.string().nullable(),
  isHealthy: z.boolean().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Credentials are masked in list/get responses
  hasApiKey: z.boolean(),
  hasApiSecret: z.boolean(),
  hasWebhookSecret: z.boolean(),
}).openapi('Provider');

const ProvidersListSchema = z.object({
  providers: z.array(ProviderSchema),
}).openapi('ProvidersList');

const CreateProviderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  baseUrl: z.string().url().optional(),
  webhookSecret: z.string().optional(),
  config: z.any().optional(),
  isActive: z.boolean().optional(),
  healthCheckUrl: z.string().url().optional(),
}).openapi('CreateProvider');

const UpdateProviderSchema = CreateProviderSchema.partial().openapi('UpdateProvider');

const ProviderDetailSchema = z.object({
  provider: ProviderSchema,
}).openapi('ProviderDetail');

const ErrorSchema = z.object({
  error: z.string(),
}).openapi('ProviderError');

const HealthCheckSchema = z.object({
  isHealthy: z.boolean(),
  message: z.string(),
  checkedAt: z.string(),
}).openapi('HealthCheck');

// Routes
const listProvidersRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Admin - Providers'],
  responses: {
    200: {
      content: { 'application/json': { schema: ProvidersListSchema } },
      description: 'List of all providers',
    },
  },
});

const getProviderRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Admin - Providers'],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ProviderDetailSchema } },
      description: 'Provider details (credentials masked)',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Provider not found',
    },
  },
});

const createProviderRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Admin - Providers'],
  request: {
    body: {
      content: { 'application/json': { schema: CreateProviderSchema } },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: ProviderDetailSchema } },
      description: 'Provider created',
    },
    409: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Provider name already exists',
    },
  },
});

const updateProviderRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Admin - Providers'],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { 'application/json': { schema: UpdateProviderSchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ProviderDetailSchema } },
      description: 'Provider updated',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Provider not found',
    },
  },
});

const deleteProviderRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Admin - Providers'],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ success: z.boolean() }).openapi('DeleteProviderSuccess') } },
      description: 'Provider deleted',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Provider not found',
    },
  },
});

const healthCheckRoute = createRoute({
  method: 'post',
  path: '/{id}/health-check',
  tags: ['Admin - Providers'],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: HealthCheckSchema } },
      description: 'Health check result',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Provider not found',
    },
  },
});

// Helper function to format provider (masking credentials)
function formatProvider(p: typeof providers.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    displayName: p.displayName,
    description: p.description,
    baseUrl: p.baseUrl,
    config: p.config,
    isActive: p.isActive,
    healthCheckUrl: p.healthCheckUrl,
    lastHealthCheckAt: p.lastHealthCheckAt?.toISOString() ?? null,
    isHealthy: p.isHealthy,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    // Indicate if credentials exist but don't expose them
    hasApiKey: !!p.apiKey,
    hasApiSecret: !!p.apiSecret,
    hasWebhookSecret: !!p.webhookSecret,
  };
}

/**
 * Encrypt credential using AES-256-GCM
 * Format: iv:authTag:encryptedData (base64 encoded)
 */
function encryptCredential(value: string | undefined): string | null {
  if (!value) return null;

  if (!SECRET_KEY || SECRET_KEY.length < 16) {
    console.warn('[Providers] SECRET_KEY not configured or too short, storing credential unencrypted');
    return value;
  }

  try {
    // Derive a 32-byte key from SECRET_KEY
    const key = scryptSync(SECRET_KEY, SALT, 32);
    const iv = randomBytes(IV_LENGTH);

    const cipher = createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(value, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:encrypted (all base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    console.error('[Providers] Encryption failed:', error);
    return value;
  }
}

/**
 * Decrypt credential encrypted with encryptCredential
 */
export function decryptCredential(encrypted: string | null): string | null {
  if (!encrypted) return null;

  // Check if it's in encrypted format (contains colons)
  if (!encrypted.includes(':')) {
    // Not encrypted, return as-is (legacy data)
    return encrypted;
  }

  if (!SECRET_KEY || SECRET_KEY.length < 16) {
    console.warn('[Providers] SECRET_KEY not configured, cannot decrypt');
    return encrypted;
  }

  try {
    const [ivBase64, authTagBase64, encryptedData] = encrypted.split(':');

    if (!ivBase64 || !authTagBase64 || !encryptedData) {
      return encrypted; // Invalid format, return as-is
    }

    const key = scryptSync(SECRET_KEY, SALT, 32);
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[Providers] Decryption failed:', error);
    return null;
  }
}

export const providersRoutes = new OpenAPIHono()
  .openapi(listProvidersRoute, async (c) => {
    const allProviders = await db.query.providers.findMany({
      orderBy: (providers, { asc }) => [asc(providers.displayName)],
    });

    return c.json({
      providers: allProviders.map(formatProvider),
    }, 200);
  })
  .openapi(getProviderRoute, async (c) => {
    const { id } = c.req.valid('param');

    const provider = await db.query.providers.findFirst({
      where: eq(providers.id, id),
    });

    if (!provider) {
      return c.json({ error: 'Provider not found' }, 404);
    }

    return c.json({
      provider: formatProvider(provider),
    }, 200);
  })
  .openapi(createProviderRoute, async (c) => {
    const data = c.req.valid('json');

    // Check if name already exists
    const existing = await db.query.providers.findFirst({
      where: eq(providers.name, data.name),
    });

    if (existing) {
      return c.json({ error: 'Provider name already exists' }, 409);
    }

    const [provider] = await db.insert(providers).values({
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      apiKey: encryptCredential(data.apiKey),
      apiSecret: encryptCredential(data.apiSecret),
      baseUrl: data.baseUrl,
      webhookSecret: encryptCredential(data.webhookSecret),
      config: data.config,
      isActive: data.isActive ?? true,
      healthCheckUrl: data.healthCheckUrl,
    }).returning();

    return c.json({
      provider: formatProvider(provider),
    }, 201);
  })
  .openapi(updateProviderRoute, async (c) => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');

    const existing = await db.query.providers.findFirst({
      where: eq(providers.id, id),
    });

    if (!existing) {
      return c.json({ error: 'Provider not found' }, 404);
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.baseUrl !== undefined) updateData.baseUrl = data.baseUrl;
    if (data.config !== undefined) updateData.config = data.config;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.healthCheckUrl !== undefined) updateData.healthCheckUrl = data.healthCheckUrl;

    // Only update credentials if explicitly provided
    if (data.apiKey !== undefined) updateData.apiKey = encryptCredential(data.apiKey);
    if (data.apiSecret !== undefined) updateData.apiSecret = encryptCredential(data.apiSecret);
    if (data.webhookSecret !== undefined) updateData.webhookSecret = encryptCredential(data.webhookSecret);

    const [provider] = await db.update(providers)
      .set(updateData)
      .where(eq(providers.id, id))
      .returning();

    return c.json({
      provider: formatProvider(provider),
    }, 200);
  })
  .openapi(deleteProviderRoute, async (c) => {
    const { id } = c.req.valid('param');

    const existing = await db.query.providers.findFirst({
      where: eq(providers.id, id),
    });

    if (!existing) {
      return c.json({ error: 'Provider not found' }, 404);
    }

    // Soft delete by setting isActive to false
    await db.update(providers)
      .set({ isActive: false })
      .where(eq(providers.id, id));

    return c.json({ success: true }, 200);
  })
  .openapi(healthCheckRoute, async (c) => {
    const { id } = c.req.valid('param');

    const provider = await db.query.providers.findFirst({
      where: eq(providers.id, id),
    });

    if (!provider) {
      return c.json({ error: 'Provider not found' }, 404);
    }

    let isHealthy = false;
    let message = 'No health check URL configured';

    if (provider.healthCheckUrl) {
      try {
        const response = await fetch(provider.healthCheckUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT),
        });
        isHealthy = response.ok;
        message = isHealthy ? 'Provider is healthy' : `Health check failed with status ${response.status}`;
      } catch (error) {
        isHealthy = false;
        message = error instanceof Error ? error.message : 'Health check failed';
      }
    }

    const checkedAt = new Date();

    // Update provider health status
    await db.update(providers)
      .set({
        isHealthy,
        lastHealthCheckAt: checkedAt,
      })
      .where(eq(providers.id, id));

    return c.json({
      isHealthy,
      message,
      checkedAt: checkedAt.toISOString(),
    }, 200);
  });
