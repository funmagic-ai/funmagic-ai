import type { Redis } from 'ioredis';

// Provider types
export type AdminProvider = 'openai' | 'google' | 'fal';

// Model capability types
export type ModelCapability = 'chat-image' | 'image-only' | 'utility';

// Admin AI message job data (from queue)
// Note: messageId is the primary identifier - tasks are embedded in messages
export interface AdminMessageJobData {
  messageId: string;
  chatId: string;
  adminId: string;
  provider: AdminProvider;
  model?: string;
  modelCapability?: ModelCapability;
  input: AdminToolInput;
  // Session data for multi-turn conversations
  session?: AdminSessionData;
  // Decrypted API key for the provider
  apiKey: string;
}

// Session data for multi-turn conversations
export interface AdminSessionData {
  openaiResponseId?: string;      // For OpenAI Responses API continuity
}

// OpenAI-specific image generation options
// Note: imageModel is NOT a valid parameter - OpenAI auto-selects the image model
export interface OpenAIImageOptions {
  size?: '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
  quality?: 'low' | 'medium' | 'high';
  format?: 'png' | 'jpeg' | 'webp';
  background?: 'transparent' | 'opaque';
}

// Google-specific image generation options
export interface GoogleImageOptions {
  aspectRatio?: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
  imageSize?: '1K' | '2K' | '4K';
}

// Combined image generation options
export interface ImageGenerationOptions {
  openai?: OpenAIImageOptions;
  google?: GoogleImageOptions;
}

// Input for admin tools
export interface AdminToolInput {
  prompt?: string;
  quotedImages?: QuotedImage[];
  options?: ImageGenerationOptions;
  [key: string]: unknown;
}

// Quoted image reference
export interface QuotedImage {
  url: string;
  storageKey?: string;
  messageId?: string;
}

// Context provided to admin provider workers
export interface AdminWorkerContext {
  messageId: string;
  chatId: string;
  adminId: string;
  provider: AdminProvider;
  model?: string;
  modelCapability: ModelCapability;
  input: AdminToolInput;
  redis: Redis;
  // Multi-turn session support
  session?: AdminSessionData;
  // Decrypted API key for the provider
  apiKey: string;
}

// Result from admin tool execution
export interface AdminToolResult {
  success: boolean;
  images?: GeneratedImage[];
  text?: string;
  error?: string;
  // Session data to persist for next turn
  session?: AdminSessionData;
  // Raw API data for debugging (optional)
  rawRequest?: AdminRawRequest;
  rawResponse?: AdminRawResponse;
}

// Generated image result - stores only storageKey, URL is generated on-demand
export interface GeneratedImage {
  storageKey: string;
  type: 'generated' | 'uploaded' | 'quoted';
  // Note: url is NOT stored permanently - generated on-demand via presigned URL
}

// Raw API request data for debugging
export interface AdminRawRequest {
  url?: string;
  method?: string;
  body?: unknown;
  timestamp: string;
}

// Raw API response data for debugging
export interface AdminRawResponse {
  status?: number;
  body?: unknown;
  latencyMs?: number;
  timestamp: string;
}

// Admin provider worker interface
export interface AdminProviderWorker {
  readonly provider: AdminProvider;
  readonly capabilities: ModelCapability[];
  execute(context: AdminWorkerContext): Promise<AdminToolResult>;
}

// Legacy tool worker interface (for backward compatibility during migration)
export interface AdminToolWorker {
  execute(context: AdminWorkerContext): Promise<AdminToolResult>;
}

// Progress event types for admin tasks
export type AdminProgressEventType =
  | 'text_delta'
  | 'text_done'
  | 'partial_image'
  | 'image_done'
  | 'complete'
  | 'error';

export interface AdminProgressEvent {
  type: AdminProgressEventType;
  messageId: string;
  chunk?: string;
  content?: string;
  index?: number;
  data?: string; // base64 image data
  storageKey?: string; // Storage key for the image
  images?: GeneratedImage[];
  error?: string;
  timestamp: string;
}

// Backwards compatibility: alias for AdminAITaskJobData
export type AdminAITaskJobData = AdminMessageJobData;
