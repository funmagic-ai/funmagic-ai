import { z } from 'zod'

// Single locale translation schema for tool types
export const ToolTypeTranslationSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
})

// Partial translation schema for non-default locales
export const PartialToolTypeTranslationSchema = z.object({
  displayName: z.string().optional(),
  description: z.string().optional(),
})

// Translations schema with explicit typing for all supported locales
export const ToolTypeTranslationsSchema = z.object({
  en: ToolTypeTranslationSchema,
  zh: PartialToolTypeTranslationSchema.optional(),
  ja: PartialToolTypeTranslationSchema.optional(),
  fr: PartialToolTypeTranslationSchema.optional(),
  es: PartialToolTypeTranslationSchema.optional(),
  pt: PartialToolTypeTranslationSchema.optional(),
  de: PartialToolTypeTranslationSchema.optional(),
  vi: PartialToolTypeTranslationSchema.optional(),
  ko: PartialToolTypeTranslationSchema.optional(),
})

// Form schema - excludes translations (handled separately as JSON string)
export const ToolTypeFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

// Full schema including translations (for API validation)
export const ToolTypeInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  translations: ToolTypeTranslationsSchema.optional(),
})

export type ToolTypeTranslation = z.infer<typeof ToolTypeTranslationSchema>
export type PartialToolTypeTranslation = z.infer<typeof PartialToolTypeTranslationSchema>
export type ToolTypeTranslations = z.infer<typeof ToolTypeTranslationsSchema>
export type ToolTypeFormInput = z.infer<typeof ToolTypeFormSchema>
export type ToolTypeInput = z.infer<typeof ToolTypeInputSchema>
