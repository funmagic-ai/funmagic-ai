import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, studioProjects, studioGenerations, adminProviders } from '@funmagic/database';
import type { StudioInput, StudioImage } from '@funmagic/database';
import { eq, and } from 'drizzle-orm';
import { streamSSE } from 'hono/streaming';
import { redis, createRedisConnection } from '@funmagic/services';
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

// Progress event types for SSE
interface StudioProgressEvent {
  type: 'text_delta' | 'text_done' | 'partial_image' | 'image_done' | 'complete' | 'error';
  messageId: string;
  chunk?: string;
  content?: string;
  index?: number;
  data?: string;
  storageKey?: string;
  images?: StudioImage[];
  error?: string;
  timestamp: string;
}

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

const streamGenerationRoute = createRoute({
  method: 'get',
  path: '/generations/{generationId}/stream',
  tags: ['Admin - Studio'],
  request: {
    params: z.object({ generationId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'SSE stream of generation progress events',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Generation not found',
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

  // Stream generation progress
  .openapi(streamGenerationRoute, async (c) => {
    const { generationId } = c.req.valid('param');

    // Get generation
    const generation = await db.query.studioGenerations.findFirst({
      where: eq(studioGenerations.id, generationId),
    });

    if (!generation) {
      throw notFound('Generation');
    }

    // Create a new Redis subscriber connection
    const subscriber = createRedisConnection();
    const channel = `studio-gen:${generationId}`;
    const streamKey = `stream:studio-gen:${generationId}`;

    return streamSSE(c, async (stream) => {
      let isCompleted = false;
      let isQuitting = false;
      let resolveStreamEnd: () => void;
      const streamEndPromise = new Promise<void>((resolve) => {
        resolveStreamEnd = resolve;
      });

      const safeQuit = async () => {
        if (!isQuitting) {
          isQuitting = true;
          try {
            await subscriber.quit();
          } catch (e) {
            console.error('[SSE] Error during quit:', e);
          }
        }
      };

      const closeStream = () => {
        if (!isCompleted) {
          isCompleted = true;
          safeQuit();
          resolveStreamEnd();
        }
      };

      // Handle subscriber connection errors
      subscriber.on('error', (err) => {
        console.error('[SSE] Redis subscriber error:', err.message);
        closeStream();
      });

      subscriber.on('close', () => {
        if (!isCompleted) {
          console.log('[SSE] Redis subscriber connection closed unexpectedly');
        }
        closeStream();
      });

      // Send initial connected event
      await stream.writeSSE({
        event: 'connected',
        data: JSON.stringify({
          type: 'connected',
          messageId: generationId,
          status: generation.status,
          timestamp: new Date().toISOString(),
        }),
      });

      // If already completed or failed, send final event from database
      if (generation.status === 'completed' || generation.status === 'failed') {
        await stream.writeSSE({
          event: generation.status,
          data: JSON.stringify({
            type: generation.status === 'completed' ? 'complete' : 'error',
            messageId: generationId,
            images: generation.images,
            content: generation.content,
            error: generation.error,
            timestamp: new Date().toISOString(),
          }),
        });

        closeStream();
        await streamEndPromise;
        return;
      }

      // 1. Read existing events from Redis Stream (catch up on missed events)
      try {
        const existingEvents = await redis.xrange(streamKey, '-', '+');
        console.log(`[SSE] Found ${existingEvents.length} events in stream ${streamKey}`);

        for (const [_id, fields] of existingEvents) {
          try {
            const eventJson = fields[1];
            const event = JSON.parse(eventJson) as StudioProgressEvent;

            await stream.writeSSE({
              event: event.type,
              data: eventJson,
            });

            console.log(`[SSE] Replayed event from stream: ${event.type}`);

            if (event.type === 'complete' || event.type === 'error') {
              console.log(`[SSE] Stream replay found terminal event, closing`);
              closeStream();
              await streamEndPromise;
              return;
            }
          } catch (e) {
            console.error('[SSE] Failed to parse stream event:', e);
          }
        }

        if (existingEvents.length > 0) {
          console.log(`[SSE] Replayed ${existingEvents.length} events from stream`);
        }
      } catch (e) {
        console.error('[SSE] Failed to read from stream:', e);
      }

      // 2. Wait for subscriber connection to be ready
      try {
        await new Promise<void>((resolve, reject) => {
          if (subscriber.status === 'ready') {
            resolve();
            return;
          }

          let settled = false;
          const timeoutId = setTimeout(() => {
            if (!settled) {
              settled = true;
              reject(new Error('Redis connection timeout'));
            }
          }, 5000);

          subscriber.once('ready', () => {
            if (!settled) {
              settled = true;
              clearTimeout(timeoutId);
              resolve();
            }
          });

          subscriber.once('error', (err) => {
            if (!settled) {
              settled = true;
              clearTimeout(timeoutId);
              reject(err);
            }
          });
        });
      } catch (err) {
        console.error('[SSE] Failed to connect Redis subscriber:', err);
        closeStream();
        await streamEndPromise;
        return;
      }

      // 3. Register message handler for real-time Pub/Sub events
      subscriber.on('message', async (ch, data) => {
        console.log(`[SSE] Received Redis message on channel: ${ch}, data length: ${data.length}`);
        if (ch !== channel || isCompleted) {
          return;
        }

        try {
          const event = JSON.parse(data) as StudioProgressEvent;
          console.log(`[SSE] Forwarding event to client: ${event.type}`);

          await stream.writeSSE({
            event: event.type,
            data: JSON.stringify(event),
          });

          if (event.type === 'complete' || event.type === 'error') {
            closeStream();
          }
        } catch (e) {
          console.error('[SSE] Failed to parse progress event:', e);
        }
      });

      // 4. Subscribe to Pub/Sub for real-time events
      await subscriber.subscribe(channel);
      console.log(`[SSE] Subscribed to channel: ${channel}`);

      // Helper to check generation status and send completion from database
      const checkAndSendCompletion = async () => {
        if (isCompleted) return false;

        const currentGeneration = await db.query.studioGenerations.findFirst({
          where: eq(studioGenerations.id, generationId),
        });

        if (currentGeneration && (currentGeneration.status === 'completed' || currentGeneration.status === 'failed')) {
          await stream.writeSSE({
            event: currentGeneration.status === 'completed' ? 'complete' : 'error',
            data: JSON.stringify({
              type: currentGeneration.status === 'completed' ? 'complete' : 'error',
              messageId: generationId,
              images: currentGeneration.images,
              content: currentGeneration.content,
              error: currentGeneration.error,
              timestamp: new Date().toISOString(),
            }),
          });

          closeStream();
          return true;
        }
        return false;
      };

      // Immediate check after subscribing
      const alreadyComplete = await checkAndSendCompletion();
      if (alreadyComplete) {
        await streamEndPromise;
        return;
      }

      // Keep connection alive with heartbeat
      const heartbeatInterval = setInterval(async () => {
        if (isCompleted) {
          clearInterval(heartbeatInterval);
          return;
        }

        try {
          await stream.writeSSE({
            event: 'heartbeat',
            data: JSON.stringify({ timestamp: new Date().toISOString() }),
          });
        } catch {
          clearInterval(heartbeatInterval);
          closeStream();
        }
      }, 15000);

      // Handle stream abort
      stream.onAbort(() => {
        clearInterval(heartbeatInterval);
        closeStream();
      });

      // Poll for completion as fallback (every 2s)
      const pollInterval = setInterval(async () => {
        if (isCompleted) {
          clearInterval(pollInterval);
          return;
        }

        console.log(`[SSE] Poll check for generation ${generationId}`);
        const found = await checkAndSendCompletion();
        if (found) {
          console.log(`[SSE] Poll found completion for generation ${generationId}`);
        }
      }, 2000);

      stream.onAbort(() => {
        clearInterval(pollInterval);
      });

      // Keep the stream alive until closeStream() is called
      await streamEndPromise;
    });
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
