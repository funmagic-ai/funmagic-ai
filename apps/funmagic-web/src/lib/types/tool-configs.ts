export interface ToolStep {
  id: string
  name: string
  type: string
  providerId: string
  providerModel: string
  cost: number
}

export interface StyleReference {
  id: string
  name: string
  imageUrl: string
  prompt?: string
}

export interface FigMeConfig {
  steps: [
    {
      id: 'image-gen'
      name: string
      type: 'image-generation'
      providerId: string
      providerModel: string
      cost: number
    },
    {
      id: '3d-gen'
      name: string
      type: '3d-generation'
      providerId: string
      providerModel: string
      cost: number
    }
  ]
  styleReferences: StyleReference[]
}

export interface BackgroundRemoveConfig {
  steps: [
    {
      id: 'remove-bg'
      name: string
      type: 'background-removal'
      providerId: string
      providerModel: string
      cost: number
    }
  ]
}

export interface CrystalMemoryConfig {
  steps: [
    {
      id: 'background-remove'
      name: string
      type: 'background-remove'
      providerId: string
      providerModel: string
      cost: number
    },
    {
      id: 'vggt'
      name: string
      type: 'vggt'
      providerId: string
      providerModel: string
      cost: number
    }
  ]
  vggtOptions?: {
    pcdSource: string
    returnPcd: boolean
    outputImageSize: number
    scaleExtent: number
  }
}

export type ToolConfig = FigMeConfig | BackgroundRemoveConfig | CrystalMemoryConfig | Record<string, unknown>

export interface ToolDetail {
  id: string
  slug: string
  title: string
  description: string | null
  shortDescription: string | null
  thumbnail: string | null
  config?: ToolConfig
  isActive: boolean
  isFeatured: boolean
  usageCount: number
}
