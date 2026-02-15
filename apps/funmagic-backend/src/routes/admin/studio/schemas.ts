import { z } from '@hono/zod-openapi';

// Project schemas
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi('StudioProject');

export const ImageSchema = z.object({
  storageKey: z.string(),
  type: z.enum(['generated', 'uploaded', 'quoted']).optional(),
}).openapi('StudioImage');

export const GenerationSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  content: z.string().nullable(),
  quotedImageIds: z.array(z.string()).nullable(),
  provider: z.string().nullable(),
  model: z.string().nullable(),
  providerOptions: z.record(z.string(), z.unknown()).nullable().optional(),
  images: z.array(ImageSchema).nullable(),
  status: z.string(),
  error: z.string().nullable(),
  input: z.unknown().nullable().optional(),
  rawRequest: z.unknown().nullable().optional(),
  rawResponse: z.unknown().nullable().optional(),
  createdAt: z.string(),
}).openapi('StudioGeneration');

export const ProjectWithGenerationsSchema = z.object({
  project: ProjectSchema,
  generations: z.array(GenerationSchema),
}).openapi('StudioProjectWithGenerations');

export const ProjectsListSchema = z.object({
  projects: z.array(ProjectSchema),
}).openapi('StudioProjectsList');

export const ProjectSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  generationCount: z.number(),
}).openapi('StudioProjectSummary');

export const ProjectsSummaryListSchema = z.object({
  projects: z.array(ProjectSummarySchema),
}).openapi('StudioProjectsSummaryList');

export const CreateProjectSchema = z.object({
  title: z.string().optional(),
}).openapi('CreateStudioProject');

export const OpenAIImageOptionsSchema = z.object({
  size: z.enum(['1024x1024', '1536x1024', '1024x1536', 'auto']).optional(),
  quality: z.enum(['low', 'medium', 'high']).optional(),
  format: z.enum(['png', 'jpeg', 'webp']).optional(),
  background: z.enum(['transparent', 'opaque']).optional(),
  moderation: z.enum(['low', 'auto']).optional(),
  imageModel: z.enum(['gpt-image-1', 'gpt-image-1.5']).optional(),
}).optional();

export const GoogleImageOptionsSchema = z.object({
  aspectRatio: z.enum(['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']).optional(),
  imageSize: z.enum(['1K', '2K', '4K']).optional(),
}).optional();

export const FalImageOptionsSchema = z.object({
  tool: z.enum(['background-remove', 'upscale']).optional(),
}).optional();

export const ImageGenerationOptionsSchema = z.object({
  openai: OpenAIImageOptionsSchema,
  google: GoogleImageOptionsSchema,
  fal: FalImageOptionsSchema,
}).optional();

export const CreateGenerationSchema = z.object({
  content: z.string().optional().default(''),
  quotedImageIds: z.array(z.string().uuid()).optional(),
  uploadedImageUrls: z.array(z.string()).optional(),
  provider: z.enum(['openai', 'google', 'fal']),
  model: z.string().optional(),
  options: ImageGenerationOptionsSchema,
}).openapi('CreateStudioGeneration');

export const CreateGenerationResponseSchema = z.object({
  userGeneration: GenerationSchema,
  assistantGeneration: GenerationSchema,
}).openapi('CreateStudioGenerationResponse');

export const GenerationStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  progress: z.string().nullable(),
  images: z.array(ImageSchema).nullable(),
  content: z.string().nullable(),
  error: z.string().nullable(),
}).openapi('StudioGenerationStatus');

export const ProvidersSchema = z.object({
  providers: z.object({
    openai: z.boolean(),
    google: z.boolean(),
    fal: z.boolean(),
  }),
}).openapi('StudioProviders');

export const BatchGenerationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  uploadedImageUrls: z.array(z.string()).min(1).max(8),
  provider: z.enum(['openai', 'google', 'fal']),
  model: z.string().optional(),
  options: ImageGenerationOptionsSchema,
}).openapi('StudioBatchGeneration');

export const BatchGenerationResponseSchema = z.object({
  generationIds: z.array(z.string().uuid()),
}).openapi('StudioBatchGenerationResponse');
