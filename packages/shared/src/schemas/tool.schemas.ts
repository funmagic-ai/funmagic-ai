import { z } from 'zod'

// Step translation schema
const StepTranslationSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
})

// Single locale translation schema for tools
export const ToolTranslationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  steps: z.record(z.string(), StepTranslationSchema).optional(),
})

// Partial translation schema for non-default locales
export const PartialToolTranslationSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  steps: z.record(z.string(), StepTranslationSchema).optional(),
})

// Translations schema with explicit typing for all supported locales
export const ToolTranslationsSchema = z.object({
  en: ToolTranslationSchema,
  zh: PartialToolTranslationSchema.optional(),
  ja: PartialToolTranslationSchema.optional(),
  fr: PartialToolTranslationSchema.optional(),
  es: PartialToolTranslationSchema.optional(),
  pt: PartialToolTranslationSchema.optional(),
  de: PartialToolTranslationSchema.optional(),
  vi: PartialToolTranslationSchema.optional(),
  ko: PartialToolTranslationSchema.optional(),
})

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
  description: z.string().optional(),
  toolTypeId: z.string().min(1, 'Tool type is required'),
  thumbnail: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  // translations handled separately via manual JSON.parse (FormData sends as string)
})

export const ToolSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  thumbnail: z.string().nullable(),
  category: z.string().optional(),
})

export type ToolTranslation = z.infer<typeof ToolTranslationSchema>
export type PartialToolTranslation = z.infer<typeof PartialToolTranslationSchema>
export type ToolTranslations = z.infer<typeof ToolTranslationsSchema>
export type CreateToolInput = z.infer<typeof CreateToolInputSchema>
export type Tool = z.infer<typeof ToolSchema>
export type ToolInput = z.infer<typeof ToolInputSchema>
