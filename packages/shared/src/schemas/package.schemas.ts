import { z } from 'zod'

// Credit package translation content for a single locale
const CreditPackageTranslationContentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})

// Partial translation schema for non-default locales
const PartialCreditPackageTranslationSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
})

// Translations schema with explicit typing for all supported locales
export const CreditPackageTranslationsSchema = z.object({
  en: CreditPackageTranslationContentSchema,
  zh: PartialCreditPackageTranslationSchema.optional(),
  ja: PartialCreditPackageTranslationSchema.optional(),
  fr: PartialCreditPackageTranslationSchema.optional(),
  es: PartialCreditPackageTranslationSchema.optional(),
  pt: PartialCreditPackageTranslationSchema.optional(),
  de: PartialCreditPackageTranslationSchema.optional(),
  vi: PartialCreditPackageTranslationSchema.optional(),
  ko: PartialCreditPackageTranslationSchema.optional(),
})
export type CreditPackageTranslations = z.infer<typeof CreditPackageTranslationsSchema>

export const CreditPackageInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  credits: z.coerce.number().min(1, 'Credits must be at least 1'),
  bonusCredits: z.coerce.number().min(0).default(0),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  sortOrder: z.coerce.number().min(0).default(0),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

export type CreditPackageInput = z.infer<typeof CreditPackageInputSchema>
