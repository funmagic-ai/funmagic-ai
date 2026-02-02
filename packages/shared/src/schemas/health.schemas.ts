import { z } from 'zod'

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string(),
})

export const HealthAllResponseSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  services: z.object({
    database: z.string(),
    redis: z.string(),
  }),
})

export type HealthResponse = z.infer<typeof HealthResponseSchema>
export type HealthAllResponse = z.infer<typeof HealthAllResponseSchema>
