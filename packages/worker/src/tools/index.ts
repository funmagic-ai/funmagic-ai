import type { ToolWorker } from '../types';
import { figmeWorker } from './figme';
import { backgroundRemoveWorker } from './background-remove';
import { crystalMemoryWorker } from './crystal-memory';

/**
 * Registry of tool workers mapped by tool slug
 */
const toolWorkers: Record<string, ToolWorker> = {
  'figme': figmeWorker,
  'background-remove': backgroundRemoveWorker,
  'crystal-memory': crystalMemoryWorker,
};

/**
 * Get the worker for a specific tool by its slug
 */
export function getToolWorker(slug: string): ToolWorker | undefined {
  return toolWorkers[slug];
}

/**
 * Check if a worker exists for a tool slug
 */
export function hasToolWorker(slug: string): boolean {
  return slug in toolWorkers;
}

/**
 * Get all registered tool slugs
 */
export function getRegisteredTools(): string[] {
  return Object.keys(toolWorkers);
}

export { figmeWorker, backgroundRemoveWorker, crystalMemoryWorker };
