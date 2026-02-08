'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useUploadFiles } from '@better-upload/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UploadDropzone } from '@/components/ui/upload-dropzone';
import { AspectRatioPreview } from '@/components/ui/aspect-ratio-preview';
import { TranslationsEditor } from '@/components/translations';
import { createTool } from '@/actions/tools';
import { IMAGE_RATIOS, RECOMMENDED_DIMENSIONS } from '@/lib/image-ratio';
import { ALLOWED_IMAGE_MIME_TYPES, IMAGE_UPLOAD_DESCRIPTION } from '@/lib/upload-config';
import { getS3PublicUrl } from '@/lib/s3-url';
import type { FormState } from '@/lib/form-types';
import { getAllToolDefinitions, getToolDefinition, type SavedToolConfig, type StepConfig, type ToolTranslations } from '@funmagic/shared';
import { ConfigFieldsSection } from './config-fields-section';
import { getPendingFile, removePendingFile, isPendingUrl, clearPendingFiles, registerPendingFile } from './field-renderers';
import type { Provider } from './field-renderers';

interface Tool {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  shortDescription: string | null;
  thumbnail: string | null;
  toolTypeId: string;
  isActive: boolean;
  isFeatured: boolean;
}

interface ToolType {
  id: string;
  name: string;
  displayName: string;
}

interface ToolGeneralFormProps {
  tool?: Tool;
  toolTypes: ToolType[];
  providers?: Provider[];
  /** Slugs already in use - these definitions will be disabled in the dropdown */
  usedSlugs?: string[];
}

type ToolFormState = FormState & { toolId?: string };

const TOOL_TRANSLATION_FIELDS = [
  {
    name: 'title',
    label: 'Title',
    required: true,
    rows: 1,
    placeholder: 'e.g., My Tool',
  },
  {
    name: 'shortDescription',
    label: 'Short Description',
    required: false,
    rows: 2,
    maxLength: 100,
    placeholder: 'Brief tagline shown in listings',
  },
  {
    name: 'description',
    label: 'Full Description',
    required: false,
    rows: 4,
    placeholder: 'Detailed description shown on tool page',
  },
];

/**
 * Tool creation form with unified Basic Info and Configuration in a single form.
 * For edit mode, use ToolEditForm instead.
 */
export function ToolGeneralForm({ tool, toolTypes, providers = [], usedSlugs = [] }: ToolGeneralFormProps) {
  const router = useRouter();
  const isCreateMode = !tool;
  const toolDefinitions = getAllToolDefinitions();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [formState, setFormState] = useState<ToolFormState>({
    success: false,
    message: '',
    errors: {},
    toolId: undefined,
  });

  // Track selected slug for create mode to show config fields
  const [selectedSlug, setSelectedSlug] = useState<string | undefined>(tool?.slug);

  // Get definition based on selected slug
  const definition = selectedSlug ? getToolDefinition(selectedSlug) : null;

  // Build initial config from definition
  const buildInitialConfig = (slug: string | undefined): SavedToolConfig => {
    if (!slug) return { steps: [] };
    const def = getToolDefinition(slug);
    if (!def) return { steps: [] };

    return {
      steps: def.steps.map((stepDef) => {
        const stepConfig: StepConfig = {
          id: stepDef.id,
          // Copy definition metadata
          name: stepDef.name,
          description: stepDef.description,
          // Copy provider info
          provider: {
            name: stepDef.provider.name,
            model: stepDef.provider.model,
            providerOptions: stepDef.provider.providerOptions ?? {},
          },
        };
        // Apply field defaults
        for (const [fieldName, fieldDef] of Object.entries(stepDef.fields)) {
          if ('default' in fieldDef) {
            stepConfig[fieldName] = fieldDef.default;
          }
        }
        return stepConfig;
      }),
    };
  };

  const [config, setConfig] = useState<SavedToolConfig>(() => buildInitialConfig(selectedSlug));
  const [thumbnailUrl, setThumbnailUrl] = useState(tool?.thumbnail ?? '');
  // Pending thumbnail file for deferred upload
  const [pendingThumbnailFile, setPendingThumbnailFile] = useState<File | null>(null);

  // Initialize translations with empty English content
  const [translations, setTranslations] = useState<ToolTranslations>({
    en: {
      title: '',
      description: '',
      shortDescription: '',
    },
  });

  // Update config when slug changes
  const handleSlugChange = (slug: string) => {
    setSelectedSlug(slug);
    setConfig(buildInitialConfig(slug));
  };

  // Upload control for config files (style references, etc.)
  const configUploadControl = useUploadFiles({
    route: 'tool-config',
    api: '/api/admin/tools/tool-config/upload',
  });

  const thumbnailUploadControl = useUploadFiles({
    route: 'thumbnails',
    api: '/api/admin/tools/thumbnails/upload',
  });

  // Handle thumbnail file selection (deferred upload)
  const handleThumbnailSelect = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      const blobUrl = URL.createObjectURL(file);
      setPendingThumbnailFile(file);
      setThumbnailUrl(blobUrl); // Show local preview
    }
  };

  // Sync thumbnail URL when tool prop changes (e.g., after save)
  useEffect(() => {
    setThumbnailUrl(tool?.thumbnail ?? '');
    setPendingThumbnailFile(null);
  }, [tool?.thumbnail]);

  // Redirect after successful creation
  useEffect(() => {
    if (formState.success && formState.toolId) {
      toast.success('Tool created successfully');
      clearPendingFiles();
      const timer = setTimeout(() => {
        router.push('/dashboard/tools');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [formState.success, formState.toolId, router]);

  // Upload a single pending file
  const uploadSingleFile = async (file: File): Promise<string> => {
    const result = await configUploadControl.upload([file], {});

    if (result && typeof result === 'object' && 'objectInfo' in result) {
      const objectInfo = result.objectInfo as { key: string };
      const s3BaseUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_URL || '';
      return s3BaseUrl ? `${s3BaseUrl}/${objectInfo.key}` : objectInfo.key;
    }

    throw new Error('Upload failed');
  };

  // Process pending uploads in config
  const processPendingUploads = async (currentConfig: SavedToolConfig): Promise<SavedToolConfig> => {
    const updatedConfig = JSON.parse(JSON.stringify(currentConfig)) as SavedToolConfig;

    for (const step of updatedConfig.steps) {
      for (const [key, value] of Object.entries(step)) {
        if (key === 'id' || key === 'optionOverrides') continue;

        // Handle array fields (like styleReferences)
        if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === 'object' && item !== null) {
              for (const [itemKey, itemValue] of Object.entries(item)) {
                if (typeof itemValue === 'string' && isPendingUrl(itemValue)) {
                  const file = getPendingFile(itemValue);
                  if (file) {
                    const uploadedUrl = await uploadSingleFile(file);
                    (item as Record<string, unknown>)[itemKey] = uploadedUrl;
                    removePendingFile(itemValue);
                    URL.revokeObjectURL(itemValue);
                  }
                }
              }
            }
          }
        }

        // Handle single string fields
        if (typeof value === 'string' && isPendingUrl(value)) {
          const file = getPendingFile(value);
          if (file) {
            const uploadedUrl = await uploadSingleFile(file);
            step[key] = uploadedUrl;
            removePendingFile(value);
            URL.revokeObjectURL(value);
          }
        }
      }
    }

    return updatedConfig;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setIsUploading(true);

    try {
      // First, upload any pending files in config
      const processedConfig = await processPendingUploads(config);

      // Update the config state with processed URLs
      setConfig(processedConfig);

      // Upload pending thumbnail if exists
      let finalThumbnailUrl = thumbnailUrl;
      if (pendingThumbnailFile && thumbnailUrl.startsWith('blob:')) {
        const result = await thumbnailUploadControl.uploadAsync([pendingThumbnailFile], {});
        if (result?.files?.length > 0) {
          // Return ONLY the key for CloudFront compatibility
          finalThumbnailUrl = result.files[0].objectInfo.key;
        }
        URL.revokeObjectURL(thumbnailUrl);
        setPendingThumbnailFile(null);
        setThumbnailUrl(finalThumbnailUrl);
      }

      // Now submit the form
      formData.set('thumbnail', finalThumbnailUrl);
      formData.set('translations', JSON.stringify(translations));
      if (processedConfig.steps.length > 0) {
        formData.set('config', JSON.stringify(processedConfig));
      }

      startTransition(async () => {
        const result = await createTool(formState, formData);
        setFormState(result);
      });
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const isBusy = isPending || isUploading;

  return (
    <form onSubmit={handleSubmit}>
      {/* New tools should be active by default */}
      <input type="hidden" name="isActive" value="on" />

      <div className="mx-auto max-w-4xl grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Core tool details and identification</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="toolTypeId">
                Tool Type <span className="text-destructive">*</span>
              </Label>
              <Select name="toolTypeId" defaultValue={tool?.toolTypeId}>
                <SelectTrigger aria-invalid={!!formState.errors?.toolTypeId}>
                  <SelectValue placeholder="Select a tool type" />
                </SelectTrigger>
                <SelectContent>
                  {toolTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formState.errors?.toolTypeId && (
                <p className="text-destructive text-xs">{formState.errors.toolTypeId[0]}</p>
              )}
              <p className="text-muted-foreground text-xs">
                Type for organizing the tool
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">
                Tool Definition <span className="text-destructive">*</span>
              </Label>
              {/* Hidden input since we're using controlled Select */}
              <input type="hidden" name="slug" value={selectedSlug ?? ''} />
              <Select
                value={selectedSlug}
                onValueChange={isCreateMode ? handleSlugChange : undefined}
                disabled={!isCreateMode}
              >
                <SelectTrigger aria-invalid={!!formState.errors?.slug}>
                  <SelectValue placeholder="Select a tool definition" />
                </SelectTrigger>
                <SelectContent>
                  {toolDefinitions.map((def) => {
                    const isUsed = usedSlugs.includes(def.name);
                    return (
                      <SelectItem key={def.name} value={def.name} disabled={isUsed}>
                        {def.displayName || def.name}
                        {isUsed && ' (already exists)'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {formState.errors?.slug && (
                <p className="text-destructive text-xs">{formState.errors.slug[0]}</p>
              )}
              <p className="text-muted-foreground text-xs">
                {isCreateMode
                  ? 'Select the tool definition (determines config schema)'
                  : 'Tool definition cannot be changed after creation'}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">
                Title (Default) <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="title"
                name="title"
                placeholder="e.g., My Tool"
                rows={1}
                value={translations.en?.title ?? ''}
                onChange={(e) => {
                  setTranslations((prev) => ({
                    ...prev,
                    en: { ...prev.en, title: e.target.value },
                  }));
                }}
                aria-invalid={!!formState.errors?.title}
              />
              {formState.errors?.title && (
                <p className="text-destructive text-xs">{formState.errors.title[0]}</p>
              )}
              <p className="text-muted-foreground text-xs">
                Default display name (English)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="shortDescription">
                Short Description (Default) <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Textarea
                id="shortDescription"
                name="shortDescription"
                placeholder="e.g., A brief description..."
                rows={2}
                value={translations.en?.shortDescription ?? ''}
                onChange={(e) => {
                  setTranslations((prev) => ({
                    ...prev,
                    en: { ...prev.en, shortDescription: e.target.value },
                  }));
                }}
                aria-invalid={!!formState.errors?.shortDescription}
              />
              {formState.errors?.shortDescription && (
                <p className="text-destructive text-xs">{formState.errors.shortDescription[0]}</p>
              )}
              <p className="text-muted-foreground text-xs">
                Brief tagline shown in listings (max 100 chars)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">
                Full Description (Default) <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="e.g., Detailed description..."
                rows={4}
                value={translations.en?.description ?? ''}
                onChange={(e) => {
                  setTranslations((prev) => ({
                    ...prev,
                    en: { ...prev.en, description: e.target.value },
                  }));
                }}
              />
              <p className="text-muted-foreground text-xs">
                Default detailed description (English)
              </p>
            </div>

            <div className="grid gap-2">
              <Label>
                Thumbnail <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <p className="text-muted-foreground text-xs">
                Recommended: {RECOMMENDED_DIMENSIONS.THUMBNAIL.width}×{RECOMMENDED_DIMENSIONS.THUMBNAIL.height}px or larger ({IMAGE_RATIOS.THUMBNAIL.label})
              </p>
              {thumbnailUrl ? (
                <AspectRatioPreview
                  imageUrl={isPendingUrl(thumbnailUrl) ? thumbnailUrl : getS3PublicUrl(thumbnailUrl)}
                  ratioType="THUMBNAIL"
                  onRemove={() => {
                    if (isPendingUrl(thumbnailUrl)) {
                      URL.revokeObjectURL(thumbnailUrl);
                      setPendingThumbnailFile(null);
                    }
                    setThumbnailUrl('');
                  }}
                  isPending={isPendingUrl(thumbnailUrl)}
                />
              ) : (
                <UploadDropzone
                  onFileSelect={handleThumbnailSelect}
                  accept={ALLOWED_IMAGE_MIME_TYPES}
                  description={IMAGE_UPLOAD_DESCRIPTION}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Translations Editor */}
        <TranslationsEditor
          translations={translations}
          onChange={setTranslations}
          fields={TOOL_TRANSLATION_FIELDS}
          title="Localized Content"
          description="Translate title and descriptions for each language"
        />

        {/* Show config fields when a definition is selected */}
        {definition && (
          <Card>
            <CardHeader>
              <CardTitle>Tool Configuration</CardTitle>
              <CardDescription>
                Configure the steps for this tool definition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConfigFieldsSection
                definition={definition}
                config={config}
                setConfig={setConfig}
                providers={providers}
              />
            </CardContent>
          </Card>
        )}

        {formState.message && !formState.success && !formState.errors && (
          <p className="text-destructive">{formState.message}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/tools')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isBusy}>
            {isUploading ? 'Uploading...' : isPending ? 'Creating...' : 'Create Tool'}
          </Button>
        </div>
      </div>
    </form>
  );
}
