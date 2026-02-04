import { z } from 'zod'

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
