import { z } from 'zod'

export const CreateToolInputSchema = z.object({
  slug: z.string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
})

export const ToolInputSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  title: z.string().min(1, 'Title is required'),
  shortDescription: z
    .string()
    .max(100, 'Short description must be 100 characters or less')
    .optional(),
  description: z.string().optional(),
  toolTypeId: z.string().min(1, 'Tool type is required'),
  thumbnail: z.string().optional(),
  isActive: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
})

export const ToolSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  thumbnail: z.string().nullable(),
  category: z.string().optional(),
})

export type CreateToolInput = z.infer<typeof CreateToolInputSchema>
export type Tool = z.infer<typeof ToolSchema>
export type ToolInput = z.infer<typeof ToolInputSchema>
