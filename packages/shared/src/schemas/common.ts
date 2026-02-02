import { z } from 'zod'

export const ErrorResponseSchema = z.object({
  error: z.string(),
})

export const MessageResponseSchema = z.object({
  message: z.string(),
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
export type MessageResponse = z.infer<typeof MessageResponseSchema>
