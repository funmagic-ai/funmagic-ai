// Common types used across frontend and backend

export type UserRole = 'user' | 'admin' | 'super_admin';
export type TaskStatus = 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
export type TransactionType = 'purchase' | 'bonus' | 'welcome' | 'usage' | 'refund' | 'reservation' | 'release' | 'admin_adjust' | 'expiry';
export type { AssetVisibility } from '../config/storage';
export type BannerType = 'main' | 'side';

// Re-export database types (optional - for convenience)
// Frontend can also import directly from @funmagic/database if needed
