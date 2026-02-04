import { z } from 'zod'

export const ToolTypeInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type ToolTypeInput = z.infer<typeof ToolTypeInputSchema>
