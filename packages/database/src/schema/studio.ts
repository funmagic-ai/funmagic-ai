import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// Studio project sessions (formerly admin_chats)
export const studioProjects = pgTable('studio_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: uuid('admin_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title'), // Auto-generated from first prompt
  // Session data for multi-turn conversations
  openaiResponseId: text('openai_response_id'), // For OpenAI Responses API continuity
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  adminIdIdx: index('studio_projects_admin_id_idx').on(table.adminId),
}));

// Image stored with storageKey only (URL generated on-demand via presigned URL)
export type StudioImage = {
  storageKey: string;
  type?: 'generated' | 'uploaded' | 'quoted';
  // Note: url is NOT stored - generated on-demand via presigned URL
};

// Studio generation input type
export type StudioInput = {
  prompt?: string;
  quotedImages?: Array<{ storageKey?: string; messageId?: string }>;
  options?: unknown;
  [key: string]: unknown;
};

// Provider-specific options stored per assistant generation
export type StudioProviderOptions = {
  openai?: {
    size?: string;
    quality?: string;
    format?: string;
    background?: string;
    moderation?: string;
    imageModel?: string;
  };
  google?: {
    aspectRatio?: string;
    imageSize?: string;
  };
  fal?: {
    tool?: string;
  };
};

// Raw API request data for debugging
export type StudioRawRequest = {
  url?: string;
  method?: string;
  body?: unknown;
  timestamp: string;
};

// Raw API response data for debugging
export type StudioRawResponse = {
  status?: number;
  body?: unknown;
  latencyMs?: number;
  timestamp: string;
};

// Studio generations (formerly admin_messages)
export const studioGenerations = pgTable('studio_generations', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => studioProjects.id, { onDelete: 'cascade' }),

  // Message info
  role: text('role').notNull(), // 'user' | 'assistant'
  content: text('content'), // Text content

  // Image references (for user messages that quote previous images)
  quotedImageIds: jsonb('quoted_image_ids').$type<string[]>(), // References to previous generation IDs

  // AI generation info (for assistant generations)
  provider: text('provider'), // 'openai' | 'google' | 'fal'
  model: text('model'),
  providerOptions: jsonb('provider_options').$type<StudioProviderOptions>(), // Provider-specific options used for this generation

  // Generated images (for assistant generations) - stored as storageKey only
  images: jsonb('images').$type<StudioImage[]>(),

  // Task fields (for assistant generations, null for user entries)
  input: jsonb('input').$type<StudioInput>(), // { prompt, quotedImages, options }
  status: text('status').notNull().default('completed'), // 'pending' | 'processing' | 'completed' | 'failed'
  progress: text('progress'), // Progress percentage as string
  error: text('error'),
  bullmqJobId: text('bullmq_job_id'),
  completedAt: timestamp('completed_at'),

  // Raw API data for debugging
  rawRequest: jsonb('raw_request').$type<StudioRawRequest>(),
  rawResponse: jsonb('raw_response').$type<StudioRawResponse>(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  projectIdIdx: index('studio_generations_project_id_idx').on(table.projectId),
  bullmqJobIdIdx: index('studio_generations_bullmq_job_id_idx').on(table.bullmqJobId),
  statusIdx: index('studio_generations_status_idx').on(table.status),
}));

// Relations
export const studioProjectsRelations = relations(studioProjects, ({ one, many }) => ({
  admin: one(users, { fields: [studioProjects.adminId], references: [users.id] }),
  generations: many(studioGenerations),
}));

export const studioGenerationsRelations = relations(studioGenerations, ({ one }) => ({
  project: one(studioProjects, { fields: [studioGenerations.projectId], references: [studioProjects.id] }),
}));
