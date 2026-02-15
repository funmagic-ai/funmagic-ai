import type { StudioProviderWorker, StudioProvider, ModelCapability } from './types';
import { openaiWorker } from './providers/openai-worker';
import { googleWorker } from './providers/google-worker';
import { falWorker } from './providers/fal-worker';

export * from './types';
export * from './progress';
export * from './utils';

/**
 * Registry of studio provider workers mapped by provider
 */
const studioProviderWorkers: Record<StudioProvider, StudioProviderWorker> = {
  'openai': openaiWorker,
  'google': googleWorker,
  'fal': falWorker,
};

/**
 * Get the worker for a specific provider
 */
export function getStudioProviderWorker(provider: StudioProvider): StudioProviderWorker | undefined {
  return studioProviderWorkers[provider];
}


/**
 * Get all registered providers
 */
export function getRegisteredProviders(): StudioProvider[] {
  return Object.keys(studioProviderWorkers) as StudioProvider[];
}

/**
 * Determine model capability based on provider and model
 */
export function determineModelCapability(provider: StudioProvider, model?: string): ModelCapability {
  // Fal.ai is always utility
  if (provider === 'fal') {
    return 'utility';
  }

  // OpenAI and Google are always chat-image (multimodal LLMs)
  return 'chat-image';
}

// Export provider workers
export { openaiWorker, googleWorker, falWorker };
