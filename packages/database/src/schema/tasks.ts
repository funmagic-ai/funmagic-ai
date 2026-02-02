import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { tools } from './tools';

// Core task table - minimal fields for fast queries
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  toolId: uuid('tool_id').notNull().references(() => tools.id),
  parentTaskId: uuid('parent_task_id'), // For child tasks (e.g., 3D gen after image gen)
  currentStepId: text('current_step_id'), // Current step being executed
  status: text('status').notNull().default('pending'), // 'pending' | 'queued' | 'processing' | 'completed' | 'failed'
  creditsCost: integer('credits_cost').notNull().default(0),
  bullmqJobId: text('bullmq_job_id'),
  queuedAt: timestamp('queued_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at'), // Soft delete
}, (table) => ({
  // Indexes for common queries
  userStatusIdx: index('tasks_user_id_status_idx').on(table.userId, table.status),
  statusQueuedIdx: index('tasks_status_queued_at_idx').on(table.status, table.queuedAt),
  parentTaskIdx: index('tasks_parent_task_id_idx').on(table.parentTaskId),
}));

// Task payloads - 1:1 relationship, stores large JSON data
export const taskPayloads = pgTable('task_payloads', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().unique().references(() => tasks.id, { onDelete: 'cascade' }),
  input: jsonb('input'),
  output: jsonb('output'),
  providerRequest: jsonb('provider_request'),
  providerResponse: jsonb('provider_response'),
  providerMeta: jsonb('provider_meta'),
  error: text('error'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Task steps - 1:N relationship for multi-step workflows
export const taskSteps = pgTable('task_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  stepId: text('step_id').notNull(),
  stepIndex: integer('step_index').notNull(),
  state: jsonb('state'), // Step-specific state data
  status: text('status').notNull().default('pending'), // 'pending' | 'processing' | 'completed' | 'failed'
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  taskIdIdx: index('task_steps_task_id_idx').on(table.taskId),
}));

// Relations
export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  tool: one(tools, { fields: [tasks.toolId], references: [tools.id] }),
  payload: one(taskPayloads, { fields: [tasks.id], references: [taskPayloads.taskId] }),
  steps: many(taskSteps),
}));

export const taskPayloadsRelations = relations(taskPayloads, ({ one }) => ({
  task: one(tasks, { fields: [taskPayloads.taskId], references: [tasks.id] }),
}));

export const taskStepsRelations = relations(taskSteps, ({ one }) => ({
  task: one(tasks, { fields: [taskSteps.taskId], references: [tasks.id] }),
}));
