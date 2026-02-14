import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, adminProviders } from '@funmagic/database';
import { eq } from 'drizzle-orm';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// Environment variables
const SECRET_KEY = process.env.SECRET_KEY;

// Encryption constants
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT = 'funmagic-salt'; // Static salt for key derivation

// Schemas
const AdminProviderSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  displayName: z.string(),
  description: z.string().nullable(),
  baseUrl: z.string().nullable(),
  config: z.any().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Credentials are masked in list/get responses
  hasApiKey: z.boolean(),
  hasApiSecret: z.boolean(),
  apiKeyPreview: z.string().nullable(),
}).openapi('AdminProvider');

const AdminProvidersListSchema = z.object({
  providers: z.array(AdminProviderSchema),
}).openapi('AdminProvidersList');

const CreateAdminProviderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  baseUrl: z.string().url().optional(),
  config: z.any().optional(),
  isActive: z.boolean().optional(),
}).openapi('CreateAdminProvider');

const UpdateAdminProviderSchema = CreateAdminProviderSchema.partial().openapi('UpdateAdminProvider');

const AdminProviderDetailSchema = z.object({
  provider: AdminProviderSchema,
}).openapi('AdminProviderDetail');

const ErrorSchema = z.object({
  error: z.string(),
}).openapi('AdminProviderError');

// Routes
const listAdminProvidersRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Admin - Admin Providers'],
  responses: {
    200: {
      content: { 'application/json': { schema: AdminProvidersListSchema } },
      description: 'List of all admin providers',
    },
  },
});

const getAdminProviderRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Admin - Admin Providers'],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: AdminProviderDetailSchema } },
      description: 'Admin provider details (credentials masked)',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Admin provider not found',
    },
  },
});

const createAdminProviderRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Admin - Admin Providers'],
  request: {
    body: {
      content: { 'application/json': { schema: CreateAdminProviderSchema } },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: AdminProviderDetailSchema } },
      description: 'Admin provider created',
    },
    409: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Admin provider name already exists',
    },
  },
});

const updateAdminProviderRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Admin - Admin Providers'],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { 'application/json': { schema: UpdateAdminProviderSchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: AdminProviderDetailSchema } },
      description: 'Admin provider updated',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Admin provider not found',
    },
  },
});

const deleteAdminProviderRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Admin - Admin Providers'],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ success: z.boolean() }).openapi('DeleteAdminProviderSuccess') } },
      description: 'Admin provider deleted',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Admin provider not found',
    },
  },
});

// Get masked preview of a credential (e.g. "••••ab3F")
function getKeyPreview(encrypted: string | null): string | null {
  if (!encrypted) return null;
  try {
    const decrypted = decryptCredential(encrypted);
    if (!decrypted || decrypted.length < 4) return '••••';
    return '••••' + decrypted.slice(-4);
  } catch {
    return '••••';
  }
}

// Helper function to format admin provider (masking credentials)
function formatAdminProvider(p: typeof adminProviders.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    displayName: p.displayName,
    description: p.description,
    baseUrl: p.baseUrl,
    config: p.config,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    // Indicate if credentials exist but don't expose them
    hasApiKey: !!p.apiKey,
    hasApiSecret: !!p.apiSecret,
    apiKeyPreview: getKeyPreview(p.apiKey),
  };
}

/**
 * Encrypt credential using AES-256-GCM
 * Format: iv:authTag:encryptedData (base64 encoded)
 */
function encryptCredential(value: string | undefined): string | null {
  if (!value) return null;

  if (!SECRET_KEY || SECRET_KEY.length < 16) {
    console.warn('[AdminProviders] SECRET_KEY not configured or too short, storing credential unencrypted');
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
    console.error('[AdminProviders] Encryption failed:', error);
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
    console.warn('[AdminProviders] SECRET_KEY not configured, cannot decrypt');
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
    console.error('[AdminProviders] Decryption failed:', error);
    return null;
  }
}

export const adminProvidersRoutes = new OpenAPIHono()
  .openapi(listAdminProvidersRoute, async (c) => {
    const allProviders = await db.query.adminProviders.findMany({
      orderBy: (adminProviders, { asc }) => [asc(adminProviders.displayName)],
    });

    return c.json({
      providers: allProviders.map(formatAdminProvider),
    }, 200);
  })
  .openapi(getAdminProviderRoute, async (c) => {
    const { id } = c.req.valid('param');

    const provider = await db.query.adminProviders.findFirst({
      where: eq(adminProviders.id, id),
    });

    if (!provider) {
      return c.json({ error: 'Admin provider not found' }, 404);
    }

    return c.json({
      provider: formatAdminProvider(provider),
    }, 200);
  })
  .openapi(createAdminProviderRoute, async (c) => {
    const data = c.req.valid('json');

    // Check if name already exists
    const existing = await db.query.adminProviders.findFirst({
      where: eq(adminProviders.name, data.name),
    });

    if (existing) {
      return c.json({ error: 'Admin provider name already exists' }, 409);
    }

    const [provider] = await db.insert(adminProviders).values({
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      apiKey: encryptCredential(data.apiKey),
      apiSecret: encryptCredential(data.apiSecret),
      baseUrl: data.baseUrl,
      config: data.config,
      isActive: data.isActive ?? true,
    }).returning();

    return c.json({
      provider: formatAdminProvider(provider),
    }, 201);
  })
  .openapi(updateAdminProviderRoute, async (c) => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');

    const existing = await db.query.adminProviders.findFirst({
      where: eq(adminProviders.id, id),
    });

    if (!existing) {
      return c.json({ error: 'Admin provider not found' }, 404);
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.baseUrl !== undefined) updateData.baseUrl = data.baseUrl;
    if (data.config !== undefined) updateData.config = data.config;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // Only update credentials if explicitly provided
    if (data.apiKey !== undefined) updateData.apiKey = encryptCredential(data.apiKey);
    if (data.apiSecret !== undefined) updateData.apiSecret = encryptCredential(data.apiSecret);

    const [provider] = await db.update(adminProviders)
      .set(updateData)
      .where(eq(adminProviders.id, id))
      .returning();

    return c.json({
      provider: formatAdminProvider(provider),
    }, 200);
  })
  .openapi(deleteAdminProviderRoute, async (c) => {
    const { id } = c.req.valid('param');

    const existing = await db.query.adminProviders.findFirst({
      where: eq(adminProviders.id, id),
    });

    if (!existing) {
      return c.json({ error: 'Admin provider not found' }, 404);
    }

    await db.delete(adminProviders).where(eq(adminProviders.id, id));

    return c.json({ success: true }, 200);
  });
