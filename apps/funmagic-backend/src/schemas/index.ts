import { z } from '@hono/zod-openapi'

// Common schemas
export const ErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
}).openapi('Error')

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
  stepId: z.string().optional(),
  parentTaskId: z.string().uuid().optional(),
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
    toolSlug: z.string(),
    parentTaskId: z.string().uuid().nullable().optional(),
    status: z.string(),
    currentStepId: z.string().nullable(),
    creditsCost: z.number().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    payload: z.object({
      id: z.string().uuid(),
      taskId: z.string().uuid(),
      input: z.any(),
      output: z.any(),
    }).nullable(),
    childTasks: z.array(z.object({
      id: z.string().uuid(),
      status: z.string(),
      currentStepId: z.string().nullable(),
      creditsCost: z.number().nullable(),
      payload: z.object({
        id: z.string().uuid(),
        taskId: z.string().uuid(),
        input: z.any(),
        output: z.any(),
      }).nullable(),
    })),
  }),
}).openapi('TaskDetail')

// User task list schemas
export const UserTaskItemSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  toolTypeName: z.string(),
  toolSlug: z.string(),
  toolTitle: z.string(),
  thumbnailUrl: z.string().nullable(),
  outputAssetId: z.string().uuid().nullable(),
  creditsCost: z.number(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
}).openapi('UserTaskItem')

export const UserTasksListSchema = z.object({
  tasks: z.array(UserTaskItemSchema),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  }),
  totalCount: z.number(),
  categories: z.array(z.object({
    id: z.string(),
    name: z.string(),
    title: z.string(),
    count: z.number(),
  })),
}).openapi('UserTasksList')

export const DeleteTaskSuccessSchema = z.object({
  success: z.boolean(),
}).openapi('DeleteUserTaskSuccess')

// User schemas
export const UserMeSchema = z.object({
  message: z.string(),
}).openapi('UserMe')
