import { z } from 'zod'

// Single locale translation schema for banners
export const BannerTranslationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  linkText: z.string().optional(),
  badge: z.string().max(20, 'Badge text must be 20 characters or less').optional(),
})

// Partial translation schema for non-default locales
export const PartialBannerTranslationSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  linkText: z.string().optional(),
  badge: z.string().max(20, 'Badge text must be 20 characters or less').optional(),
})

// Translations schema with explicit typing for all supported locales
export const BannerTranslationsSchema = z.object({
  en: BannerTranslationSchema,
  zh: PartialBannerTranslationSchema.optional(),
  ja: PartialBannerTranslationSchema.optional(),
  fr: PartialBannerTranslationSchema.optional(),
  es: PartialBannerTranslationSchema.optional(),
  pt: PartialBannerTranslationSchema.optional(),
  de: PartialBannerTranslationSchema.optional(),
  vi: PartialBannerTranslationSchema.optional(),
  ko: PartialBannerTranslationSchema.optional(),
})

export const BannerInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  thumbnail: z.string().min(1, 'Banner image is required'),
  description: z.string().optional(),
  link: z.string().url('Invalid URL format').optional().or(z.literal('')),
  linkText: z.string().min(1, 'Link text is required').default('Learn More'),
  linkTarget: z.enum(['_self', '_blank']).default('_self'),
  type: z.enum(['main', 'side']).default('main'),
  position: z.coerce.number().min(0).default(0),
  badge: z.string().max(20, 'Badge text must be 20 characters or less').optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  isActive: z.boolean().default(true),
  translations: BannerTranslationsSchema.optional(),
})

export type BannerTranslation = z.infer<typeof BannerTranslationSchema>
export type PartialBannerTranslation = z.infer<typeof PartialBannerTranslationSchema>
export type BannerTranslations = z.infer<typeof BannerTranslationsSchema>
export type BannerInput = z.infer<typeof BannerInputSchema>
