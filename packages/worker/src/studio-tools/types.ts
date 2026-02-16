import type { Redis } from 'ioredis';

// Provider types
export type StudioProvider = 'openai' | 'google' | 'fal';

// Model capability types
export type ModelCapability = 'chat-image' | 'image-only' | 'utility';

// Studio generation job data (from queue)
// Note: messageId is the primary identifier - tasks are embedded in generations
export interface StudioGenerationJobData {
  messageId: string;
  projectId: string;
  adminId: string;
  provider: StudioProvider;
  model?: string;
  modelCapability?: ModelCapability;
  input: StudioToolInput;
  // Session data for multi-turn conversations
  session?: StudioSessionData;
  // Decrypted API key for the provider
  apiKey: string;
  // Correlation ID propagated from HTTP request
  requestId?: string;
}

// Session data for multi-turn conversations
export interface StudioSessionData {
  openaiResponseId?: string;      // For OpenAI Responses API continuity
}

// OpenAI-specific image generation options
export interface OpenAIImageOptions {
  size?: '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
  quality?: 'low' | 'medium' | 'high';
  format?: 'png' | 'jpeg' | 'webp';
  background?: 'transparent' | 'opaque';
  imageModel?: 'gpt-image-1' | 'gpt-image-1.5';
}

// Google-specific image generation options
export interface GoogleImageOptions {
  aspectRatio?: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
  imageSize?: '1K' | '2K' | '4K';
}

// Fal-specific options
export interface FalOptions {
  tool?: 'background-remove' | 'upscale';
}

// Combined image generation options
export interface ImageGenerationOptions {
  openai?: OpenAIImageOptions;
  google?: GoogleImageOptions;
  fal?: FalOptions;
}

// Input for studio tools
export interface StudioToolInput {
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

// Context provided to studio provider workers
export interface StudioWorkerContext {
  messageId: string;
  projectId: string;
  adminId: string;
  provider: StudioProvider;
  model?: string;
  modelCapability: ModelCapability;
  input: StudioToolInput;
  redis: Redis;
  // Multi-turn session support
  session?: StudioSessionData;
  // Decrypted API key for the provider
  apiKey: string;
}

// Result from studio tool execution
export interface StudioResult {
  success: boolean;
  images?: GeneratedImage[];
  text?: string;
  error?: string;
  // Session data to persist for next turn
  session?: StudioSessionData;
  // Raw API data for debugging (optional)
  rawRequest?: StudioRawRequest;
  rawResponse?: StudioRawResponse;
}

// Generated image result - stores only storageKey, URL is generated on-demand
export interface GeneratedImage {
  storageKey: string;
  type: 'generated' | 'uploaded' | 'quoted';
  // Note: url is NOT stored permanently - generated on-demand via presigned URL
}

// Raw API request data for debugging
export interface StudioRawRequest {
  url?: string;
  method?: string;
  body?: unknown;
  timestamp: string;
}

// Raw API response data for debugging
export interface StudioRawResponse {
  status?: number;
  body?: unknown;
  latencyMs?: number;
  timestamp: string;
}

// Studio provider worker interface
export interface StudioProviderWorker {
  readonly provider: StudioProvider;
  readonly capabilities: ModelCapability[];
  execute(context: StudioWorkerContext): Promise<StudioResult>;
}

// Progress event types for studio tasks
export type StudioProgressEventType =
  | 'text_delta'
  | 'text_done'
  | 'partial_image'
  | 'image_done'
  | 'complete'
  | 'error';

export interface StudioProgressEvent {
  type: StudioProgressEventType;
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
