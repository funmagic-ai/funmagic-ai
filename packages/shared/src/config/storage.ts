// Asset visibility levels
export const ASSET_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  ADMIN_PRIVATE: 'admin-private',
} as const

export type AssetVisibility = (typeof ASSET_VISIBILITY)[keyof typeof ASSET_VISIBILITY]

// Asset module identifiers
export const ASSET_MODULE = {
  TOOLS: 'tools',
  BANNERS: 'banners',
  AI_STUDIO: 'ai-studio',
  TASKS: 'tasks',
} as const

export type AssetModule = (typeof ASSET_MODULE)[keyof typeof ASSET_MODULE]
