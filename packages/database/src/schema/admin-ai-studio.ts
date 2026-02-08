import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// Admin AI Studio chat sessions
export const adminChats = pgTable('admin_chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: uuid('admin_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title'), // Auto-generated from first message
  // Session data for multi-turn conversations
  openaiResponseId: text('openai_response_id'), // For OpenAI Responses API continuity
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  adminIdIdx: index('admin_chats_admin_id_idx').on(table.adminId),
}));

// Image stored with storageKey only (URL generated on-demand via presigned URL)
export type AdminMessageImage = {
  storageKey: string;
  type?: 'generated' | 'uploaded' | 'quoted';
  // Note: url is NOT stored - generated on-demand via presigned URL
};

// Admin task input type
export type AdminTaskInput = {
  prompt?: string;
  quotedImages?: Array<{ storageKey?: string; messageId?: string }>;
  options?: unknown;
  [key: string]: unknown;
};

// Raw API request data for debugging
export type AdminRawRequest = {
  url?: string;
  method?: string;
  body?: unknown;
  timestamp: string;
};

// Raw API response data for debugging
export type AdminRawResponse = {
  status?: number;
  body?: unknown;
  latencyMs?: number;
  timestamp: string;
};

// Admin AI Studio messages (now includes task fields)
export const adminMessages = pgTable('admin_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').notNull().references(() => adminChats.id, { onDelete: 'cascade' }),

  // Message info
  role: text('role').notNull(), // 'user' | 'assistant'
  content: text('content'), // Text content

  // Image references (for user messages that quote previous images)
  quotedImageIds: jsonb('quoted_image_ids').$type<string[]>(), // References to previous message IDs

  // AI generation info (for assistant messages)
  provider: text('provider'), // 'openai' | 'google' | 'fal'
  model: text('model'),

  // Generated images (for assistant messages) - stored as storageKey only
  images: jsonb('images').$type<AdminMessageImage[]>(),

  // Task fields (for assistant messages, null for user messages)
  input: jsonb('input').$type<AdminTaskInput>(), // { prompt, quotedImages, options }
  status: text('status').notNull().default('completed'), // 'pending' | 'processing' | 'completed' | 'failed'
  progress: text('progress'), // Progress percentage as string
  error: text('error'),
  bullmqJobId: text('bullmq_job_id'),
  completedAt: timestamp('completed_at'),

  // Raw API data for debugging
  rawRequest: jsonb('raw_request').$type<AdminRawRequest>(),
  rawResponse: jsonb('raw_response').$type<AdminRawResponse>(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  chatIdIdx: index('admin_messages_chat_id_idx').on(table.chatId),
  bullmqJobIdIdx: index('admin_messages_bullmq_job_id_idx').on(table.bullmqJobId),
  statusIdx: index('admin_messages_status_idx').on(table.status),
}));

// Relations
export const adminChatsRelations = relations(adminChats, ({ one, many }) => ({
  admin: one(users, { fields: [adminChats.adminId], references: [users.id] }),
  messages: many(adminMessages),
}));

export const adminMessagesRelations = relations(adminMessages, ({ one }) => ({
  chat: one(adminChats, { fields: [adminMessages.chatId], references: [adminChats.id] }),
}));
