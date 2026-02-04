import { z } from 'zod'

export const ProviderInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  appId: z.string().optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  baseUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
  config: z.unknown().optional(),
  isActive: z.boolean().default(true),
})

export type ProviderInput = z.infer<typeof ProviderInputSchema>
