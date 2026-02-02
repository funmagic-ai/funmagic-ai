import { pgTable, uuid, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const providers = pgTable('providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  type: text('type').notNull(), // 'openai' | 'anthropic' | 'replicate' | etc
  apiKey: text('api_key'), // Encrypted
  apiSecret: text('api_secret'), // Encrypted
  baseUrl: text('base_url'),
  webhookSecret: text('webhook_secret'),
  config: jsonb('config'),
  isActive: boolean('is_active').notNull().default(true),
  healthCheckUrl: text('health_check_url'),
  lastHealthCheckAt: timestamp('last_health_check_at'),
  isHealthy: boolean('is_healthy').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});
