import { pgTable, uuid, text, integer, numeric, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const credits = pgTable('credits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  balance: integer('balance').notNull().default(0),
  reservedBalance: integer('reserved_balance').default(0),
  lifetimePurchased: integer('lifetime_purchased').default(0),
  lifetimeUsed: integer('lifetime_used').default(0),
  lifetimeRefunded: integer('lifetime_refunded').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

export const creditTransactions = pgTable('credit_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'purchase' | 'bonus' | 'usage' | 'refund' | etc
  amount: integer('amount').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  description: text('description'),
  referenceType: text('reference_type'), // 'task' | 'payment' | 'admin' | etc
  referenceId: uuid('reference_id'),
  metadata: jsonb('metadata'),
  idempotencyKey: text('idempotency_key').unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const creditPackages = pgTable('credit_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  credits: integer('credits').notNull(),
  bonusCredits: integer('bonus_credits').default(0),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  stripePriceId: text('stripe_price_id'),
  stripeProductId: text('stripe_product_id'),
  isPopular: boolean('is_popular').default(false),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at'), // Soft delete
});

// Relations
export const creditsRelations = relations(credits, ({ one }) => ({
  user: one(users, { fields: [credits.userId], references: [users.id] }),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, { fields: [creditTransactions.userId], references: [users.id] }),
}));
