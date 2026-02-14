import { z } from '@hono/zod-openapi'

// Import base schemas from shared (for validation logic and types)
import {
  ErrorResponseSchema as BaseErrorSchema,
  MessageResponseSchema as BaseMessageSchema,
  CreateTaskInputSchema as BaseCreateTaskSchema,
  ToolSchema as BaseToolSchema,
  HealthResponseSchema as BaseHealthSchema,
  HealthAllResponseSchema as BaseHealthAllSchema,
} from '@funmagic/shared/schemas'

// Re-create schemas with OpenAPI registration
// Note: @hono/zod-openapi requires using its own z instance for .openapi() method

// Common schemas
export const ErrorSchema = z.object({
  error: z.string(),
}).openapi('Error')

export const MessageSchema = z.object({
  message: z.string(),
}).openapi('Message')

// Health schemas
export const HealthSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string(),
}).openapi('Health')

export const HealthDbSchema = z.object({
  status: z.enum(['ok', 'error']),
  database: z.string(),
}).openapi('HealthDb')

export const HealthRedisSchema = z.object({
  status: z.enum(['ok', 'error']),
  redis: z.string(),
}).openapi('HealthRedis')

export const HealthAllSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  services: z.object({
    database: z.string(),
    redis: z.string(),
  }),
}).openapi('HealthAll')

// Tool schemas
export const ToolSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  thumbnail: z.string().nullable(),
  category: z.string().optional(),
}).openapi('Tool')

export const ToolsListSchema = z.object({
  tools: z.array(ToolSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }).optional(),
  categories: z.array(z.object({
    id: z.string(),
    name: z.string(),
    title: z.string(),
  })).optional(),
}).openapi('ToolsList')

export const ToolDetailSchema = z.object({
  tool: z.object({
    id: z.string().uuid(),
    slug: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    thumbnail: z.string().nullable(),
    config: z.any(),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    usageCount: z.number(),
  }),
}).openapi('ToolDetail')

// Task schemas
export const CreateTaskSchema = z.object({
  toolSlug: z.string().min(1, 'Tool slug is required'),
  stepId: z.string().optional(),  // For multi-step tools
  parentTaskId: z.string().uuid().optional(),  // For child tasks (e.g., 3D gen after image gen)
  input: z.record(z.string(), z.any()),
}).openapi('CreateTask')

export const TaskSchema = z.object({
  task: z.object({
    id: z.string().uuid(),
    status: z.string(),
    creditsCost: z.number().nullable(),
  }),
}).openapi('Task')

export const TaskDetailSchema = z.object({
  task: z.object({
    id: z.string().uuid(),
    userId: z.string(),
    toolId: z.string().uuid(),
    parentTaskId: z.string().uuid().nullable().optional(),
    status: z.string(),
    creditsCost: z.number().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    payload: z.object({
      id: z.string().uuid(),
      taskId: z.string().uuid(),
      input: z.any(),
      output: z.any(),
    }).nullable(),
  }),
}).openapi('TaskDetail')

// User schemas
export const UserMeSchema = z.object({
  message: z.string(),
}).openapi('UserMe')

// Credits schemas
export const BalanceSchema = z.object({
  message: z.string(),
}).openapi('Balance')

export const TransactionsSchema = z.object({
  message: z.string(),
}).openapi('Transactions')

// Re-export shared schemas for direct use in validation (without OpenAPI wrapper)
export {
  BaseErrorSchema,
  BaseMessageSchema,
  BaseCreateTaskSchema,
  BaseToolSchema,
  BaseHealthSchema,
  BaseHealthAllSchema,
}
