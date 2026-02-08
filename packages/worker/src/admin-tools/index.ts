import type { AdminProviderWorker, AdminProvider, ModelCapability } from './types';
import { openaiWorker } from './providers/openai-worker';
import { googleWorker } from './providers/google-worker';
import { falWorker } from './providers/fal-worker';

export * from './types';
export * from './progress';
export * from './utils';

/**
 * Registry of admin provider workers mapped by provider
 */
const adminProviderWorkers: Record<AdminProvider, AdminProviderWorker> = {
  'openai': openaiWorker,
  'google': googleWorker,
  'fal': falWorker,
};

/**
 * Get the worker for a specific provider
 */
export function getAdminProviderWorker(provider: AdminProvider): AdminProviderWorker | undefined {
  return adminProviderWorkers[provider];
}

/**
 * Check if a worker exists for a provider
 */
export function hasAdminProviderWorker(provider: AdminProvider): boolean {
  return provider in adminProviderWorkers;
}

/**
 * Get all registered providers
 */
export function getRegisteredProviders(): AdminProvider[] {
  return Object.keys(adminProviderWorkers) as AdminProvider[];
}

/**
 * Determine model capability based on provider and model
 */
export function determineModelCapability(provider: AdminProvider, model?: string): ModelCapability {
  // Fal.ai is always utility
  if (provider === 'fal') {
    return 'utility';
  }

  // OpenAI and Google are always chat-image (multimodal LLMs)
  return 'chat-image';
}

// Export provider workers
export { openaiWorker, googleWorker, falWorker };
