import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, studioProjects, studioGenerations, adminProviders } from '@funmagic/database';
import type { StudioInput, StudioImage } from '@funmagic/database';
import { eq, and } from 'drizzle-orm';
import { AppError, ERROR_CODES } from '@funmagic/shared';
import { addStudioGenerationJob } from '../../../lib/queue';
import { notFound, badRequest } from '../../../lib/errors';
import { ErrorSchema } from '../../../schemas';
import { decryptCredential } from '../admin-providers';
import {
  CreateGenerationSchema,
  CreateGenerationResponseSchema,
  GenerationStatusSchema,
  GenerationSchema,
  ImageSchema,
} from './schemas';

/**
 * Get images from quoted generation IDs
 */
async function getQuotedImages(generationIds: string[]): Promise<Array<{ url: string; storageKey?: string; messageId: string }>> {
  const images: Array<{ url: string; storageKey?: string; messageId: string }> = [];

  for (const genId of generationIds) {
    const generation = await db.query.studioGenerations.findFirst({
      where: eq(studioGenerations.id, genId),
    });

    if (generation?.images && Array.isArray(generation.images)) {
      for (const img of generation.images as StudioImage[]) {
        images.push({
          url: img.storageKey,
          storageKey: img.storageKey,
          messageId: genId,
        });
      }
    }
  }

  return images;
}

// Route definitions
const createGenerationRoute = createRoute({
  method: 'post',
  path: '/projects/{projectId}/generations',
  tags: ['Admin - Studio'],
  request: {
    params: z.object({ projectId: z.string().uuid() }),
    body: {
      content: { 'application/json': { schema: CreateGenerationSchema } },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: CreateGenerationResponseSchema } },
      description: 'Generation created, task queued',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Provider not configured',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Project not found',
    },
    500: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Internal error',
    },
  },
});

const getGenerationStatusRoute = createRoute({
  method: 'get',
  path: '/generations/{generationId}/status',
  tags: ['Admin - Studio'],
  request: {
    params: z.object({ generationId: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ generation: GenerationStatusSchema }) } },
      description: 'Generation status',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Generation not found',
    },
  },
});

export const generationsRoutes = new OpenAPIHono<{ Variables: { user: { id: string } } }>()
  // Create generation
  .openapi(createGenerationRoute, async (c) => {
    const user = c.get('user');
    const userId = user?.id || '';

    const { projectId } = c.req.valid('param');
    const { content, quotedImageIds, uploadedImageUrls, provider, model, options } = c.req.valid('json');

    // Look up provider in admin_providers table
    const providerRecord = await db.query.adminProviders.findFirst({
      where: and(
        eq(adminProviders.name, provider),
        eq(adminProviders.isActive, true),
      ),
    });

    if (!providerRecord?.apiKey) {
      throw badRequest(ERROR_CODES.PROVIDER_NOT_CONFIGURED, `Provider "${provider}" not configured. Please add API key in Admin Providers settings.`);
    }

    const apiKey = decryptCredential(providerRecord.apiKey);
    if (!apiKey) {
      throw new AppError({ code: ERROR_CODES.PROVIDER_KEY_DECRYPTION_FAILED, message: `Failed to decrypt API key for provider "${provider}"`, statusCode: 500 });
    }

    // Verify project exists and belongs to user
    const project = await db.query.studioProjects.findFirst({
      where: eq(studioProjects.id, projectId),
    });

    if (!project || project.adminId !== userId) {
      throw notFound('Project');
    }

    // Get quoted images if any
    const quotedImages = quotedImageIds ? await getQuotedImages(quotedImageIds) : [];

    // Convert uploaded storage keys to the same format as quoted images
    // The worker resolves storage keys to presigned URLs before sending to AI providers
    const uploadedImages = (uploadedImageUrls || []).map((storageKey: string) => ({
      url: storageKey,
      storageKey,
      messageId: undefined,
    }));

    // Combine quoted and uploaded images
    const allInputImages = [...quotedImages, ...uploadedImages];

    // Build user generation images from uploads
    const userImages = (uploadedImageUrls || []).map((storageKey: string) => ({
      storageKey,
      type: 'uploaded' as const,
    }));

    // Create user generation entry
    const [userGeneration] = await db.insert(studioGenerations).values({
      projectId,
      role: 'user',
      content,
      quotedImageIds: quotedImageIds || null,
      images: userImages.length > 0 ? userImages : null,
      status: 'completed',
    }).returning();

    // Build input for the worker
    const taskInput: StudioInput = {
      prompt: content,
      quotedImages: allInputImages.map(img => ({
        storageKey: img.storageKey,
        messageId: img.messageId,
      })),
      options,
    };

    // Create assistant generation (pending)
    const [assistantGeneration] = await db.insert(studioGenerations).values({
      projectId,
      role: 'assistant',
      content: null,
      provider,
      model: model || null,
      providerOptions: options || null,
      input: taskInput,
      status: 'pending',
    }).returning();

    // Update project title if first generation
    const generationCount = await db.query.studioGenerations.findMany({
      where: eq(studioGenerations.projectId, projectId),
    });

    if (generationCount.length <= 2 && !project.title) {
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      await db.update(studioProjects)
        .set({ title, updatedAt: new Date() })
        .where(eq(studioProjects.id, projectId));
    } else {
      await db.update(studioProjects)
        .set({ updatedAt: new Date() })
        .where(eq(studioProjects.id, projectId));
    }

    // Build session data from project for multi-turn conversations
    const session: { openaiResponseId?: string } | undefined = project.openaiResponseId
      ? { openaiResponseId: project.openaiResponseId }
      : undefined;

    // Queue the job
    await addStudioGenerationJob({
      messageId: assistantGeneration.id,
      projectId,
      adminId: userId,
      provider,
      model,
      input: {
        prompt: content,
        quotedImages: allInputImages,
        options,
      },
      session,
      apiKey,
      requestId: c.get('requestId' as never) as string | undefined,
    });

    // Update generation with bullmq job id
    await db.update(studioGenerations)
      .set({ bullmqJobId: `studio-gen-${assistantGeneration.id}` })
      .where(eq(studioGenerations.id, assistantGeneration.id));

    return c.json({
      userGeneration: {
        id: userGeneration.id,
        projectId: userGeneration.projectId,
        role: userGeneration.role as 'user',
        content: userGeneration.content,
        quotedImageIds: userGeneration.quotedImageIds as string[] | null,
        provider: null,
        model: null,
        images: userGeneration.images as Array<{ storageKey: string; type?: 'generated' | 'uploaded' | 'quoted' }> | null,
        status: userGeneration.status,
        error: null,
        createdAt: userGeneration.createdAt.toISOString(),
      },
      assistantGeneration: {
        id: assistantGeneration.id,
        projectId: assistantGeneration.projectId,
        role: assistantGeneration.role as 'assistant',
        content: null,
        quotedImageIds: null,
        provider: assistantGeneration.provider,
        model: assistantGeneration.model,
        providerOptions: assistantGeneration.providerOptions ?? null,
        images: null,
        status: assistantGeneration.status,
        error: null,
        createdAt: assistantGeneration.createdAt.toISOString(),
      },
    }, 201);
  })

  // Get generation status
  .openapi(getGenerationStatusRoute, async (c) => {
    const { generationId } = c.req.valid('param');

    const generation = await db.query.studioGenerations.findFirst({
      where: eq(studioGenerations.id, generationId),
    });

    if (!generation) {
      throw notFound('Generation');
    }

    return c.json({
      generation: {
        id: generation.id,
        status: generation.status,
        progress: generation.progress,
        images: generation.images as StudioImage[] | null,
        content: generation.content,
        error: generation.error,
      },
    }, 200);
  });
