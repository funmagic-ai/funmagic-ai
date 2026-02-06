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
import { updateTool } from '@/actions/tools';
import { IMAGE_RATIOS, RECOMMENDED_DIMENSIONS } from '@/lib/image-ratio';
import { getS3PublicUrl } from '@/lib/s3-url';
import type { FormState } from '@/lib/form-types';
import { getToolDefinition, type SavedToolConfig, type StepConfig, type ToolTranslations } from '@funmagic/shared';
import { ConfigFieldsSection } from './config-fields-section';
import {
  getPendingFile,
  removePendingFile,
  isPendingUrl,
  clearPendingFiles,
  registerPendingFile,
} from './field-renderers';
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
  config?: unknown;
  translations?: ToolTranslations;
}

interface ToolType {
  id: string;
  name: string;
  displayName: string;
}

interface ToolEditFormProps {
  tool: Tool;
  toolTypes: ToolType[];
  providers: Provider[];
}

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
 * Unified tool edit form that shows both Basic Information and Tool Configuration
 * with a single submit button (matching provider form pattern).
 */
export function ToolEditForm({ tool, toolTypes, providers }: ToolEditFormProps) {
  const router = useRouter();
  const definition = getToolDefinition(tool.slug);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    success: false,
    message: '',
    errors: {},
  });

  // Thumbnail state - store the raw key/URL, show display URL in preview
  const [thumbnailUrl, setThumbnailUrl] = useState(tool.thumbnail ?? '');
  // Pending thumbnail file for deferred upload
  const [pendingThumbnailFile, setPendingThumbnailFile] = useState<File | null>(null);

  // Translations state
  const [translations, setTranslations] = useState<ToolTranslations>(
    tool.translations ?? {
      en: {
        title: tool.title,
        description: tool.description ?? '',
        shortDescription: tool.shortDescription ?? '',
      },
    }
  );

  // Config state
  const existingConfig = (tool.config as SavedToolConfig) || { steps: [] };
  const buildInitialSteps = (): StepConfig[] => {
    if (!definition) return [];
    return definition.steps.map((stepDef) => {
      const existingStep = existingConfig.steps?.find((s) => s.id === stepDef.id);
      const stepConfig: StepConfig = {
        id: stepDef.id,
        // Copy definition metadata (always use definition as source of truth)
        name: stepDef.name,
        description: stepDef.description,
        // Copy provider info from definition, merge with existing providerOptions
        // Preserve admin model override and customProviderOptions
        provider: {
          name: stepDef.provider.name,
          model: existingStep?.provider?.model ?? stepDef.provider.model,
          providerOptions: {
            ...(stepDef.provider.providerOptions ?? {}),
            ...(existingStep?.provider?.providerOptions ?? {}),
          },
          customProviderOptions: existingStep?.provider?.customProviderOptions ?? {},
        },
      };

      // Apply field values (prefer existing, fallback to defaults)
      for (const [fieldName, fieldDef] of Object.entries(stepDef.fields)) {
        if (existingStep && fieldName in existingStep) {
          stepConfig[fieldName] = existingStep[fieldName];
        } else if ('default' in fieldDef) {
          stepConfig[fieldName] = fieldDef.default;
        }
      }

      return stepConfig;
    });
  };

  const [config, setConfig] = useState<SavedToolConfig>({
    ...existingConfig,
    steps: buildInitialSteps(),
  });

  // Upload control for config files (style references, etc.)
  const configUploadControl = useUploadFiles({
    route: 'styles',
    api: '/api/admin/tools/figme/styles/upload',
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

  // Sync thumbnail URL when tool prop changes
  useEffect(() => {
    setThumbnailUrl(tool.thumbnail ?? '');
    setPendingThumbnailFile(null);
  }, [tool.thumbnail]);

  // Upload a single pending file using uploadAsync which returns a Promise
  // Returns only the S3 key (not full URL) for CloudFront compatibility
  const uploadSingleFile = async (file: File): Promise<string> => {
    const result = await configUploadControl.uploadAsync([file], {});

    if (result && result.files && result.files.length > 0) {
      const key = result.files[0].objectInfo.key;
      // Return ONLY the key, not full URL - getS3PublicUrl will prepend base URL at display time
      return key;
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
      formData.set('config', JSON.stringify(processedConfig));
      formData.set('translations', JSON.stringify(translations));

      startTransition(async () => {
        try {
          const result = await updateTool(formState, formData);

          if (result.success) {
            toast.success(result.message || 'Tool updated successfully');
            clearPendingFiles();
            await new Promise(resolve => setTimeout(resolve, 1500));
            router.push('/dashboard/tools');
          } else {
            // Show error toast for failed case
            toast.error(result.message || 'Failed to update tool');
          }

          setFormState(result);
        } catch (error) {
          console.error('Failed to update tool:', error);
          toast.error('Server error: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
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
      <input type="hidden" name="id" value={tool.id} />
      <input type="hidden" name="slug" value={tool.slug} />
      {/* Preserve isActive and isFeatured values - hidden inputs only sent when value is "on" */}
      {tool.isActive && <input type="hidden" name="isActive" value="on" />}
      {tool.isFeatured && <input type="hidden" name="isFeatured" value="on" />}

      <div className="mx-auto max-w-4xl grid gap-6">
        {/* Basic Information Section */}
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
              <Select name="toolTypeId" defaultValue={tool.toolTypeId}>
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
            </div>

            <div className="grid gap-2">
              <Label>Tool Definition</Label>
              <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/50">
                {definition?.displayName || tool.slug}
              </p>
              <p className="text-muted-foreground text-xs">
                Tool definition cannot be changed after creation
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
              />
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
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  description={{
                    fileTypes: 'JPEG, PNG, WebP, GIF',
                    maxFileSize: '5MB',
                    maxFiles: 1,
                  }}
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

        {/* Tool Configuration Section */}
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

        {/* Bottom buttons matching provider form pattern */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/tools')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isBusy}>
            {isUploading ? 'Uploading...' : isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}
