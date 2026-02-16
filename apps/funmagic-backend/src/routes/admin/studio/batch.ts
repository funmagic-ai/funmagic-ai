import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, studioProjects, studioGenerations, adminProviders } from '@funmagic/database';
import type { StudioInput } from '@funmagic/database';
import { eq, and } from 'drizzle-orm';
import { AppError, ERROR_CODES } from '@funmagic/shared';
import { addStudioBatchJob } from '../../../lib/queue';
import type { StudioGenerationJobData } from '../../../lib/queue';
import { notFound, badRequest } from '../../../lib/errors';
import { ErrorSchema } from '../../../schemas';
import { decryptCredential } from '../admin-providers';
import { BatchGenerationSchema, BatchGenerationResponseSchema } from './schemas';

const batchGenerationRoute = createRoute({
  method: 'post',
  path: '/projects/{projectId}/batch',
  tags: ['Admin - Studio'],
  request: {
    params: z.object({ projectId: z.string().uuid() }),
    body: {
      content: { 'application/json': { schema: BatchGenerationSchema } },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: BatchGenerationResponseSchema } },
      description: 'Batch generations created',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Provider not configured or too many images',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Project not found',
    },
  },
});

export const batchRoutes = new OpenAPIHono<{ Variables: { user: { id: string } } }>()
  .openapi(batchGenerationRoute, async (c) => {
    const user = c.get('user');
    const userId = user?.id || '';

    const { projectId } = c.req.valid('param');
    const { prompt, uploadedImageUrls, provider, model, options } = c.req.valid('json');

    // Validate image count
    if (uploadedImageUrls.length > 8) {
      throw badRequest(ERROR_CODES.VALIDATION_ERROR, 'Maximum 8 images per batch');
    }

    // Look up provider
    const providerRecord = await db.query.adminProviders.findFirst({
      where: and(
        eq(adminProviders.name, provider),
        eq(adminProviders.isActive, true),
      ),
    });

    if (!providerRecord?.apiKey) {
      throw badRequest(ERROR_CODES.PROVIDER_NOT_CONFIGURED, `Provider "${provider}" not configured.`);
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

    // Create one user generation entry for the batch prompt
    await db.insert(studioGenerations).values({
      projectId,
      role: 'user',
      content: `[Batch: ${uploadedImageUrls.length} images] ${prompt}`,
      status: 'completed',
    });

    // Create one assistant generation per uploaded image
    const generationIds: string[] = [];
    const jobs: StudioGenerationJobData[] = [];

    for (const imageUrl of uploadedImageUrls) {
      const taskInput: StudioInput = {
        prompt,
        quotedImages: [{ storageKey: imageUrl }],
        options,
      };

      const [generation] = await db.insert(studioGenerations).values({
        projectId,
        role: 'assistant',
        content: null,
        provider,
        model: model || null,
        providerOptions: options || null,
        input: taskInput,
        status: 'pending',
      }).returning();

      generationIds.push(generation.id);

      // Update with bullmq job id
      await db.update(studioGenerations)
        .set({ bullmqJobId: `studio-gen-${generation.id}` })
        .where(eq(studioGenerations.id, generation.id));

      jobs.push({
        messageId: generation.id,
        projectId,
        adminId: userId,
        provider,
        model,
        input: {
          prompt,
          quotedImages: [{ url: imageUrl, storageKey: imageUrl }],
          options,
        },
        session: project.openaiResponseId
          ? { openaiResponseId: project.openaiResponseId }
          : undefined,
        apiKey,
        requestId: c.get('requestId' as never) as string | undefined,
      });
    }

    // Queue all jobs
    await addStudioBatchJob(jobs);

    // Update project timestamp
    await db.update(studioProjects)
      .set({ updatedAt: new Date() })
      .where(eq(studioProjects.id, projectId));

    return c.json({ generationIds }, 201);
  });
