import { z } from 'zod'

export const CreateTaskInputSchema = z.object({
  toolSlug: z.string().min(1, 'Tool slug is required'),
  input: z.record(z.string(), z.any()),
})

export const TaskIdParamSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
})

export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>
export type TaskIdParam = z.infer<typeof TaskIdParamSchema>
