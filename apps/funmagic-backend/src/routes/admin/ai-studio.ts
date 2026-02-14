import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, adminChats, adminMessages, adminProviders } from '@funmagic/database';
import type { AdminMessageImage, AdminTaskInput } from '@funmagic/database';
import { eq, desc, asc, and, isNotNull, inArray } from 'drizzle-orm';
import { streamSSE } from 'hono/streaming';
import { redis, createRedisConnection, getPresignedDownloadUrl, getBucketForVisibility } from '@funmagic/services';
import { ASSET_VISIBILITY } from '@funmagic/shared';
import { addAdminMessageJob, removeAdminMessageJob } from '../../lib/queue';
import { decryptCredential } from './admin-providers';

const BUCKET_ADMIN = getBucketForVisibility(ASSET_VISIBILITY.ADMIN_PRIVATE);

// Schemas
const ChatSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi('AdminChat');

const ImageSchema = z.object({
  storageKey: z.string(),
  type: z.enum(['generated', 'uploaded', 'quoted']).optional(),
}).openapi('AdminMessageImage');

const MessageSchema = z.object({
  id: z.string().uuid(),
  chatId: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  content: z.string().nullable(),
  quotedImageIds: z.array(z.string()).nullable(),
  provider: z.string().nullable(),
  model: z.string().nullable(),
  images: z.array(ImageSchema).nullable(),
  status: z.string(),
  error: z.string().nullable(),
  createdAt: z.string(),
}).openapi('AdminMessage');

const ChatWithMessagesSchema = z.object({
  chat: ChatSchema,
  messages: z.array(MessageSchema),
}).openapi('AdminChatWithMessages');

const ChatsListSchema = z.object({
  chats: z.array(ChatSchema),
}).openapi('AdminChatsList');

const CreateChatSchema = z.object({
  title: z.string().optional(),
}).openapi('CreateAdminChat');

const OpenAIImageOptionsSchema = z.object({
  size: z.enum(['1024x1024', '1536x1024', '1024x1536', 'auto']).optional(),
  quality: z.enum(['low', 'medium', 'high']).optional(),
  format: z.enum(['png', 'jpeg', 'webp']).optional(),
  background: z.enum(['transparent', 'opaque']).optional(),
  moderation: z.enum(['low', 'auto']).optional(),
}).optional();

const GoogleImageOptionsSchema = z.object({
  aspectRatio: z.enum(['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']).optional(),
  imageSize: z.enum(['1K', '2K', '4K']).optional(),
}).optional();

const ImageGenerationOptionsSchema = z.object({
  openai: OpenAIImageOptionsSchema,
  google: GoogleImageOptionsSchema,
}).optional();

const SendMessageSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  quotedImageIds: z.array(z.string().uuid()).optional(),
  uploadedImageUrls: z.array(z.string()).optional(),
  provider: z.enum(['openai', 'google', 'fal']),
  model: z.string().optional(),
  options: ImageGenerationOptionsSchema,
}).openapi('SendAdminMessage');

const SendMessageResponseSchema = z.object({
  userMessage: MessageSchema,
  assistantMessage: MessageSchema,
}).openapi('SendAdminMessageResponse');

const MessageStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  progress: z.string().nullable(),
  images: z.array(ImageSchema).nullable(),
  content: z.string().nullable(),
  error: z.string().nullable(),
}).openapi('AdminMessageStatus');

const ErrorSchema = z.object({
  error: z.string(),
}).openapi('AdminAIStudioError');

const ProvidersSchema = z.object({
  providers: z.object({
    openai: z.boolean(),
    google: z.boolean(),
    fal: z.boolean(),
  }),
}).openapi('AdminAIStudioProviders');

// Routes definitions
const listChatsRoute = createRoute({
  method: 'get',
  path: '/chats',
  tags: ['Admin - AI Studio'],
  responses: {
    200: {
      content: { 'application/json': { schema: ChatsListSchema } },
      description: 'List of chats',
    },
  },
});

const createChatRoute = createRoute({
  method: 'post',
  path: '/chats',
  tags: ['Admin - AI Studio'],
  request: {
    body: {
      content: { 'application/json': { schema: CreateChatSchema } },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: z.object({ chat: ChatSchema }) } },
      description: 'Chat created',
    },
  },
});

const getChatRoute = createRoute({
  method: 'get',
  path: '/chats/{chatId}',
  tags: ['Admin - AI Studio'],
  request: {
    params: z.object({ chatId: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ChatWithMessagesSchema } },
      description: 'Chat with messages',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Chat not found',
    },
  },
});

const deleteChatRoute = createRoute({
  method: 'delete',
  path: '/chats/{chatId}',
  tags: ['Admin - AI Studio'],
  request: {
    params: z.object({ chatId: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ success: z.boolean() }) } },
      description: 'Chat deleted',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Chat not found',
    },
  },
});

const sendMessageRoute = createRoute({
  method: 'post',
  path: '/chats/{chatId}/messages',
  tags: ['Admin - AI Studio'],
  request: {
    params: z.object({ chatId: z.string().uuid() }),
    body: {
      content: { 'application/json': { schema: SendMessageSchema } },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: SendMessageResponseSchema } },
      description: 'Message sent, task created',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Provider not configured',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Chat not found',
    },
    500: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Internal error',
    },
  },
});

const streamMessageRoute = createRoute({
  method: 'get',
  path: '/messages/{messageId}/stream',
  tags: ['Admin - AI Studio'],
  request: {
    params: z.object({ messageId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'SSE stream of message progress events',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Message not found',
    },
  },
});

const getMessageStatusRoute = createRoute({
  method: 'get',
  path: '/messages/{messageId}/status',
  tags: ['Admin - AI Studio'],
  request: {
    params: z.object({ messageId: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ message: MessageStatusSchema }) } },
      description: 'Message status',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Message not found',
    },
  },
});

const getProvidersRoute = createRoute({
  method: 'get',
  path: '/providers',
  tags: ['Admin - AI Studio'],
  responses: {
    200: {
      content: { 'application/json': { schema: ProvidersSchema } },
      description: 'Available providers based on configured API keys',
    },
  },
});

const getAssetUrlRoute = createRoute({
  method: 'get',
  path: '/assets/url',
  tags: ['Admin - AI Studio'],
  request: {
    query: z.object({
      storageKey: z.string().min(1, 'Storage key is required'),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ url: z.string(), expiresIn: z.number() }) } },
      description: 'Presigned download URL',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Invalid storage key',
    },
  },
});

// Admin progress event types
interface AdminProgressEvent {
  type: 'text_delta' | 'text_done' | 'partial_image' | 'image_done' | 'complete' | 'error';
  messageId: string;
  chunk?: string;
  content?: string;
  index?: number;
  data?: string;
  storageKey?: string;
  images?: AdminMessageImage[];
  error?: string;
  timestamp: string;
}

/**
 * Get images from quoted message IDs
 */
async function getQuotedImages(messageIds: string[]): Promise<Array<{ url: string; storageKey?: string; messageId: string }>> {
  const images: Array<{ url: string; storageKey?: string; messageId: string }> = [];

  for (const messageId of messageIds) {
    const message = await db.query.adminMessages.findFirst({
      where: eq(adminMessages.id, messageId),
    });

    if (message?.images && Array.isArray(message.images)) {
      for (const img of message.images as AdminMessageImage[]) {
        images.push({
          url: img.storageKey, // Use storageKey as URL (will be resolved by worker)
          storageKey: img.storageKey,
          messageId,
        });
      }
    }
  }

  return images;
}

export const aiStudioRoutes = new OpenAPIHono<{ Variables: { user: { id: string } } }>()
  // List chats
  .openapi(listChatsRoute, async (c) => {
    const user = c.get('user');
    const userId = user?.id || '';

    const chats = await db.query.adminChats.findMany({
      where: eq(adminChats.adminId, userId),
      orderBy: desc(adminChats.updatedAt),
    });

    return c.json({
      chats: chats.map(chat => ({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt.toISOString(),
        updatedAt: chat.updatedAt.toISOString(),
      })),
    }, 200);
  })

  // Create chat
  .openapi(createChatRoute, async (c) => {
    const user = c.get('user');
    const userId = user?.id || '';

    const { title } = c.req.valid('json');

    const [chat] = await db.insert(adminChats).values({
      adminId: userId,
      title: title || null,
    }).returning();

    return c.json({
      chat: {
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt.toISOString(),
        updatedAt: chat.updatedAt.toISOString(),
      },
    }, 201);
  })

  // Get chat with messages
  .openapi(getChatRoute, async (c) => {
    const user = c.get('user');
    const userId = user?.id || '';

    const { chatId } = c.req.valid('param');

    const chat = await db.query.adminChats.findFirst({
      where: eq(adminChats.id, chatId),
    });

    if (!chat || chat.adminId !== userId) {
      return c.json({ error: 'Chat not found' }, 404);
    }

    const messages = await db.query.adminMessages.findMany({
      where: eq(adminMessages.chatId, chatId),
      orderBy: asc(adminMessages.createdAt),
    });

    return c.json({
      chat: {
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt.toISOString(),
        updatedAt: chat.updatedAt.toISOString(),
      },
      messages: messages.map(msg => ({
        id: msg.id,
        chatId: msg.chatId,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        quotedImageIds: msg.quotedImageIds as string[] | null,
        provider: msg.provider,
        model: msg.model,
        images: msg.images as AdminMessageImage[] | null,
        status: msg.status,
        error: msg.error,
        createdAt: msg.createdAt.toISOString(),
      })),
    }, 200);
  })

  // Delete chat
  .openapi(deleteChatRoute, async (c) => {
    const user = c.get('user');
    const userId = user?.id || '';

    const { chatId } = c.req.valid('param');

    const chat = await db.query.adminChats.findFirst({
      where: eq(adminChats.id, chatId),
    });

    if (!chat || chat.adminId !== userId) {
      return c.json({ error: 'Chat not found' }, 404);
    }

    // Find pending/processing messages to cancel their BullMQ jobs
    const messagesToCancel = await db.query.adminMessages.findMany({
      where: and(
        eq(adminMessages.chatId, chatId),
        inArray(adminMessages.status, ['pending', 'processing'])
      ),
    });

    // Cancel pending BullMQ jobs
    await Promise.all(
      messagesToCancel.map(msg => removeAdminMessageJob(msg.id))
    );

    // Delete chat (messages cascade due to foreign keys)
    await db.delete(adminChats).where(eq(adminChats.id, chatId));

    return c.json({ success: true }, 200);
  })

  // Send message
  .openapi(sendMessageRoute, async (c) => {
    const user = c.get('user');
    const userId = user?.id || '';

    const { chatId } = c.req.valid('param');
    const { content, quotedImageIds, uploadedImageUrls, provider, model, options } = c.req.valid('json');

    // Look up provider in admin_providers table
    const providerRecord = await db.query.adminProviders.findFirst({
      where: and(
        eq(adminProviders.name, provider),
        eq(adminProviders.isActive, true),
      ),
    });

    if (!providerRecord?.apiKey) {
      return c.json({ error: `Provider "${provider}" not configured. Please add API key in Admin Providers settings.` }, 400);
    }

    const apiKey = decryptCredential(providerRecord.apiKey);
    if (!apiKey) {
      return c.json({ error: `Failed to decrypt API key for provider "${provider}"` }, 500);
    }

    // Verify chat exists and belongs to user
    const chat = await db.query.adminChats.findFirst({
      where: eq(adminChats.id, chatId),
    });

    if (!chat || chat.adminId !== userId) {
      return c.json({ error: 'Chat not found' }, 404);
    }

    // Get quoted images if any
    const quotedImages = quotedImageIds ? await getQuotedImages(quotedImageIds) : [];

    // Convert uploaded image URLs to the same format as quoted images
    const uploadedImages = (uploadedImageUrls || []).map((url: string) => ({
      url,
      storageKey: url,
      messageId: undefined,
    }));

    // Combine quoted and uploaded images
    const allInputImages = [...quotedImages, ...uploadedImages];

    // Create user message
    const [userMessage] = await db.insert(adminMessages).values({
      chatId,
      role: 'user',
      content,
      quotedImageIds: quotedImageIds || null,
      status: 'completed',
    }).returning();

    // Build input for the worker
    const taskInput: AdminTaskInput = {
      prompt: content,
      quotedImages: allInputImages.map(img => ({
        storageKey: img.storageKey,
        messageId: img.messageId,
      })),
      options,
    };

    // Create assistant message (pending) with task fields embedded
    const [assistantMessage] = await db.insert(adminMessages).values({
      chatId,
      role: 'assistant',
      content: null,
      provider,
      model: model || null,
      input: taskInput,
      status: 'pending',
    }).returning();

    // Update chat title if first message
    const messageCount = await db.query.adminMessages.findMany({
      where: eq(adminMessages.chatId, chatId),
    });

    if (messageCount.length <= 2 && !chat.title) {
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      await db.update(adminChats)
        .set({ title, updatedAt: new Date() })
        .where(eq(adminChats.id, chatId));
    } else {
      await db.update(adminChats)
        .set({ updatedAt: new Date() })
        .where(eq(adminChats.id, chatId));
    }

    // Build session data from chat for multi-turn conversations
    // Note: Google now reconstructs history from adminMessages, so we only pass OpenAI session data
    const session: { openaiResponseId?: string } | undefined = chat.openaiResponseId
      ? { openaiResponseId: chat.openaiResponseId }
      : undefined;

    // Queue the job with decrypted API key - use messageId as primary identifier
    await addAdminMessageJob({
      messageId: assistantMessage.id,
      chatId,
      adminId: userId,
      provider,
      model,
      input: {
        prompt: content,
        quotedImages: allInputImages,
        options,
      },
      // Pass session data for multi-turn support (OpenAI only - Google reconstructs from messages)
      session,
      // Pass decrypted API key for worker
      apiKey,
    });

    // Update message with bullmq job id
    await db.update(adminMessages)
      .set({ bullmqJobId: `admin-msg-${assistantMessage.id}` })
      .where(eq(adminMessages.id, assistantMessage.id));

    return c.json({
      userMessage: {
        id: userMessage.id,
        chatId: userMessage.chatId,
        role: userMessage.role as 'user',
        content: userMessage.content,
        quotedImageIds: userMessage.quotedImageIds as string[] | null,
        provider: null,
        model: null,
        images: null,
        status: userMessage.status,
        error: null,
        createdAt: userMessage.createdAt.toISOString(),
      },
      assistantMessage: {
        id: assistantMessage.id,
        chatId: assistantMessage.chatId,
        role: assistantMessage.role as 'assistant',
        content: null,
        quotedImageIds: null,
        provider: assistantMessage.provider,
        model: assistantMessage.model,
        images: null,
        status: assistantMessage.status,
        error: null,
        createdAt: assistantMessage.createdAt.toISOString(),
      },
    }, 201);
  })

  // Stream message progress
  .openapi(streamMessageRoute, async (c) => {
    const { messageId } = c.req.valid('param');

    // Get message
    const message = await db.query.adminMessages.findFirst({
      where: eq(adminMessages.id, messageId),
    });

    if (!message) {
      return c.json({ error: 'Message not found' }, 404);
    }

    // Create a new Redis subscriber connection using factory (not duplicate())
    const subscriber = createRedisConnection();
    const channel = `admin-msg:${messageId}`;
    const streamKey = `stream:admin-msg:${messageId}`;

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
          messageId,
          status: message.status,
          timestamp: new Date().toISOString(),
        }),
      });

      // If already completed or failed, send final event from database
      if (message.status === 'completed' || message.status === 'failed') {
        await stream.writeSSE({
          event: message.status,
          data: JSON.stringify({
            type: message.status === 'completed' ? 'complete' : 'error',
            messageId,
            images: message.images,
            content: message.content,
            error: message.error,
            timestamp: new Date().toISOString(),
          }),
        });

        closeStream();
        await streamEndPromise;
        return;
      }

      // 1. Read existing events from Redis Stream (catch up on missed events)
      // This handles the case where worker published events before SSE connected
      try {
        const existingEvents = await redis.xrange(streamKey, '-', '+');
        console.log(`[SSE] Found ${existingEvents.length} events in stream ${streamKey}`);

        for (const [_id, fields] of existingEvents) {
          try {
            // Redis XRANGE returns fields as ['data', jsonString]
            const eventJson = fields[1];
            const event = JSON.parse(eventJson) as AdminProgressEvent;

            await stream.writeSSE({
              event: event.type,
              data: eventJson,
            });

            console.log(`[SSE] Replayed event from stream: ${event.type}`);

            // If we replayed a complete/error event, we're done
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

      // 2. Wait for subscriber connection to be ready with proper timeout cleanup
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
          console.log(`[SSE] Ignoring message: ch=${ch}, expected=${channel}, isCompleted=${isCompleted}`);
          return;
        }

        try {
          const event = JSON.parse(data) as AdminProgressEvent;
          console.log(`[SSE] Forwarding event to client: ${event.type}`);

          await stream.writeSSE({
            event: event.type,
            data: JSON.stringify(event),
          });

          // Close stream on completion or error
          if (event.type === 'complete' || event.type === 'error') {
            closeStream();
          }
        } catch (e) {
          console.error('[SSE] Failed to parse admin progress event:', e);
        }
      });

      // 4. Subscribe to Pub/Sub for real-time events
      await subscriber.subscribe(channel);
      console.log(`[SSE] Subscribed to channel: ${channel}`);

      // Helper to check message status and send completion from database
      const checkAndSendCompletion = async () => {
        if (isCompleted) return false;

        const currentMessage = await db.query.adminMessages.findFirst({
          where: eq(adminMessages.id, messageId),
        });

        if (currentMessage && (currentMessage.status === 'completed' || currentMessage.status === 'failed')) {
          await stream.writeSSE({
            event: currentMessage.status === 'completed' ? 'complete' : 'error',
            data: JSON.stringify({
              type: currentMessage.status === 'completed' ? 'complete' : 'error',
              messageId,
              images: currentMessage.images,
              content: currentMessage.content,
              error: currentMessage.error,
              timestamp: new Date().toISOString(),
            }),
          });

          closeStream();
          return true;
        }
        return false;
      };

      // Immediate check after subscribing (in case worker completed during subscription)
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

        console.log(`[SSE] Poll check for message ${messageId}`);
        const found = await checkAndSendCompletion();
        if (found) {
          console.log(`[SSE] Poll found completion for message ${messageId}`);
        }
      }, 2000);

      stream.onAbort(() => {
        clearInterval(pollInterval);
      });

      // Keep the stream alive until closeStream() is called
      await streamEndPromise;
    });
  })

  // Get message status
  .openapi(getMessageStatusRoute, async (c) => {
    const { messageId } = c.req.valid('param');

    const message = await db.query.adminMessages.findFirst({
      where: eq(adminMessages.id, messageId),
    });

    if (!message) {
      return c.json({ error: 'Message not found' }, 404);
    }

    return c.json({
      message: {
        id: message.id,
        status: message.status,
        progress: message.progress,
        images: message.images as AdminMessageImage[] | null,
        content: message.content,
        error: message.error,
      },
    }, 200);
  })

  // Get available providers
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
  })

  // Get presigned URL for asset
  .openapi(getAssetUrlRoute, async (c) => {
    const { storageKey } = c.req.valid('query');

    if (!storageKey || storageKey.includes('..')) {
      return c.json({ error: 'Invalid storage key' }, 400);
    }

    try {
      const url = await getPresignedDownloadUrl({ bucket: BUCKET_ADMIN, storageKey });

      return c.json({ url, expiresIn: -1 }, 200);
    } catch (error) {
      console.error('[AI Studio] Failed to generate presigned URL:', error);
      return c.json({ error: 'Failed to generate URL' }, 400);
    }
  });
