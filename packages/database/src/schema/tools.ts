import { pgTable, uuid, text, boolean, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const toolTypes = pgTable('tool_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at'), // Soft delete
});

export const tools = pgTable('tools', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  shortDescription: text('short_description'),
  thumbnail: text('thumbnail'),
  toolTypeId: uuid('tool_type_id').notNull().references(() => toolTypes.id),
  config: jsonb('config').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  isFeatured: boolean('is_featured').notNull().default(false),
  usageCount: integer('usage_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at'), // Soft delete
});

// Relations
export const toolTypesRelations = relations(toolTypes, ({ many }) => ({
  tools: many(tools),
}));

export const toolsRelations = relations(tools, ({ one }) => ({
  toolType: one(toolTypes, { fields: [tools.toolTypeId], references: [toolTypes.id] }),
}));
