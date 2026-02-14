import { pgTable, uuid, text, boolean, integer, timestamp, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations, isNull } from 'drizzle-orm';

export const toolTypes = pgTable('tool_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  translations: jsonb('translations').notNull().default({ en: { title: '', description: '' } }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at'), // Soft delete
}, (table) => [
  uniqueIndex('tool_types_name_unique_active').on(table.name).where(isNull(table.deletedAt)),
]);

export const tools = pgTable('tools', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  thumbnail: text('thumbnail'),
  toolTypeId: uuid('tool_type_id').notNull().references(() => toolTypes.id),
  config: jsonb('config').notNull(),
  translations: jsonb('translations').notNull().default({ en: { title: '', description: '' } }),
  isActive: boolean('is_active').notNull().default(true),
  isFeatured: boolean('is_featured').notNull().default(false),
  usageCount: integer('usage_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at'), // Soft delete
}, (table) => [
  uniqueIndex('tools_slug_unique_active').on(table.slug).where(isNull(table.deletedAt)),
]);

// Relations
export const toolTypesRelations = relations(toolTypes, ({ many }) => ({
  tools: many(tools),
}));

export const toolsRelations = relations(tools, ({ one }) => ({
  toolType: one(toolTypes, { fields: [tools.toolTypeId], references: [toolTypes.id] }),
}));
