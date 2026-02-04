import { z } from 'zod'
import type { FormState } from './form-types'

export function parseFormData<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T,
  formData: FormData
): { success: true; data: z.infer<T> } | { success: false; state: FormState } {
  const rawData: Record<string, unknown> = {}

  for (const [key, value] of formData.entries()) {
    if (value === 'on') {
      rawData[key] = true
    } else if (value === '') {
      rawData[key] = undefined
    } else {
      rawData[key] = value
    }
  }

  // Handle unchecked switches (they don't appear in FormData)
  for (const key of Object.keys(schema.shape)) {
    if (!(key in rawData)) {
      const fieldSchema = schema.shape[key]
      if (fieldSchema instanceof z.ZodDefault) {
        const inner = fieldSchema._def.innerType
        if (inner instanceof z.ZodBoolean) {
          rawData[key] = false
        }
      } else if (fieldSchema instanceof z.ZodBoolean) {
        rawData[key] = false
      }
    }
  }

  const result = schema.safeParse(rawData)

  if (!result.success) {
    return {
      success: false,
      state: {
        success: false,
        message: 'Please fix the errors below',
        errors: result.error.flatten().fieldErrors as Record<string, string[]>,
      },
    }
  }

  return { success: true, data: result.data }
}
