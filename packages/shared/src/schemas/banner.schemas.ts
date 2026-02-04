import { z } from 'zod'

export const BannerInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  thumbnail: z.string().min(1, 'Banner image is required'),
  description: z.string().optional(),
  link: z.string().url('Invalid URL format').optional().or(z.literal('')),
  linkText: z.string().optional(),
  type: z.enum(['main', 'side']).default('main'),
  position: z.coerce.number().min(0).default(0),
  badge: z.string().max(20, 'Badge text must be 20 characters or less').optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type BannerInput = z.infer<typeof BannerInputSchema>
