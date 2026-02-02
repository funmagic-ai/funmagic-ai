// Common types used across frontend and backend

export type UserRole = 'user' | 'admin' | 'super_admin';
export type TaskStatus = 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
export type TransactionType = 'purchase' | 'bonus' | 'welcome' | 'usage' | 'refund' | 'reservation' | 'release' | 'admin_adjust' | 'expiry';
export type ProviderType = 'openai' | 'anthropic' | 'replicate' | 'stability' | 'elevenlabs' | 'fal' | 'tripo' | 'self_hosted' | 'custom';
export type AssetVisibility = 'private' | 'public' | 'admin-private';
export type BannerType = 'main' | 'side';

// Re-export database types (optional - for convenience)
// Frontend can also import directly from @funmagic/database if needed
