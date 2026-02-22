import type { ToolWorker } from '../types';
import { figmeWorker } from './figme';
import { backgroundRemoveWorker } from './background-remove';
import { crystalMemoryWorker } from './crystal-memory';
import { vintageTraceWorker } from './vintage-trace';
import { imageTo3dWorker } from './image-to-3d';

/**
 * Registry of tool workers mapped by tool slug
 */
const toolWorkers: Record<string, ToolWorker> = {
  'figme': figmeWorker,
  'background-remove': backgroundRemoveWorker,
  'crystal-memory': crystalMemoryWorker,
  'vintage-trace': vintageTraceWorker,
  'image-to-3d': imageTo3dWorker,
};

/**
 * Get the worker for a specific tool by its slug
 */
export function getToolWorker(slug: string): ToolWorker | undefined {
  return toolWorkers[slug];
}


/**
 * Get all registered tool slugs
 */
export function getRegisteredTools(): string[] {
  return Object.keys(toolWorkers);
}

export { figmeWorker, backgroundRemoveWorker, crystalMemoryWorker, vintageTraceWorker, imageTo3dWorker };
