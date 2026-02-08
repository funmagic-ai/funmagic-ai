import { pgTable, uuid, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const adminProviders = pgTable('admin_providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(), // 'openai' | 'google' | 'fal'
  displayName: text('display_name').notNull(),
  description: text('description'),
  apiKey: text('api_key'), // Encrypted (AES-256-GCM)
  apiSecret: text('api_secret'), // Encrypted (optional, for providers that need it)
  baseUrl: text('base_url'), // Custom endpoint (optional)
  config: jsonb('config'), // Rate limits, costs, etc.
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});
