import { figmeDefinition } from './figme';
import { backgroundRemoveDefinition } from './background-remove';
import { crystalMemoryDefinition } from './crystal-memory';
import type { ToolDefinition, ToolRegistry } from './types';

/**
 * Tool registry - maps tool names (slugs) to their definitions
 */
export const toolRegistry: ToolRegistry = {
  'figme': figmeDefinition,
  'background-remove': backgroundRemoveDefinition,
  'crystal-memory': crystalMemoryDefinition,
} as const;

/**
 * Type for valid tool names
 */
export type ToolName = keyof typeof toolRegistry;

/**
 * Get all available tool definitions
 * Used by admin to populate tool type dropdown
 */
export function getAllToolDefinitions(): ToolDefinition[] {
  return Object.values(toolRegistry);
}

/**
 * Get a specific tool definition by name
 * Returns null if not found
 */
export function getToolDefinition(name: string): ToolDefinition | null {
  return toolRegistry[name as ToolName] ?? null;
}

/**
 * Get all tool names
 */
export function getAllToolNames(): string[] {
  return Object.keys(toolRegistry);
}

/**
 * Check if a tool name is valid
 */
export function isValidToolName(name: string): name is ToolName {
  return name in toolRegistry;
}

// Re-export types
export * from './types';

// Re-export individual definitions for direct imports if needed
export { figmeDefinition } from './figme';
export { backgroundRemoveDefinition } from './background-remove';
export { crystalMemoryDefinition } from './crystal-memory';
