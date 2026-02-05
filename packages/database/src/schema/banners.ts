import { pgTable, uuid, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const banners = pgTable('banners', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  thumbnail: text('thumbnail').notNull(),
  link: text('link'),
  linkText: text('link_text').notNull().default('Learn More'),
  linkTarget: text('link_target').notNull().default('_self'), // '_self' | '_blank'
  type: text('type').notNull().default('main'), // 'main' | 'side'
  position: integer('position').default(0),
  badge: text('badge'),
  badgeColor: text('badge_color'),
  translations: jsonb('translations').$type<Record<string, unknown>>().default({}),
  isActive: boolean('is_active').notNull().default(true),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at'), // Soft delete
});
