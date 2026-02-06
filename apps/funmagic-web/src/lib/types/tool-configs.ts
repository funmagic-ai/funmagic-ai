import type { SavedToolConfig } from '@funmagic/shared'

export interface StyleReference {
  id: string
  name: string
  imageUrl: string
  prompt?: string
}

export interface ToolDetail {
  id: string
  slug: string
  title: string
  description: string | null
  shortDescription: string | null
  thumbnail: string | null
  config?: SavedToolConfig
  isActive: boolean
  isFeatured: boolean
  usageCount: number
}
