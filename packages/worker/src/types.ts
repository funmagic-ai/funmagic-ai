import type { Redis } from 'ioredis';

// Job data passed from the backend
export interface AITaskJobData {
  taskId: string;
  toolSlug: string;
  stepId?: string;  // Optional step ID for multi-step tools
  input: Record<string, unknown>;
  userId: string;
  parentTaskId?: string;  // For child tasks (e.g., 3D gen after image gen)
}

// Context provided to tool workers
export interface WorkerContext {
  taskId: string;
  stepId?: string;
  userId: string;
  input: Record<string, unknown>;
  redis: Redis;
}

// Step configuration from tool.config
export interface StepConfig {
  id: string;
  name: string;
  inputSchema?: Record<string, unknown>;
  cost?: number;
}

// Tool configuration stored in database
export interface ToolConfig {
  steps: StepConfig[];
  version?: string;
  [key: string]: unknown;
}

// Provider credentials (decrypted)
export interface ProviderCredentials {
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
  config?: Record<string, unknown>;
}

// Result from a tool worker step
export interface StepResult {
  success: boolean;
  output?: Record<string, unknown>;
  assetId?: string;
  error?: string;
}

// Tool worker interface
export interface ToolWorker {
  execute(context: WorkerContext): Promise<StepResult>;
}
