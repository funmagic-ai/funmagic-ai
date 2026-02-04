'use client';

import { useActionState, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUploadFiles } from '@better-upload/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { createTool, updateToolGeneral } from '@/actions/tools';
import { IMAGE_RATIOS, RECOMMENDED_DIMENSIONS } from '@/lib/image-ratio';
import { getS3PublicUrl } from '@/lib/s3-url';
import type { FormState } from '@/lib/form-types';

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
}

export function ToolGeneralForm({ tool, toolTypes }: ToolGeneralFormProps) {
  const router = useRouter();
  const isCreateMode = !tool;
  const serverAction = isCreateMode ? createTool : updateToolGeneral;

  type ToolFormState = FormState & { toolId?: string };
  const [state, action, isPending] = useActionState<ToolFormState, FormData>(serverAction, {
    success: false,
    message: '',
    errors: {},
    toolId: undefined,
  });
  const [thumbnailUrl, setThumbnailUrl] = useState(getS3PublicUrl(tool?.thumbnail ?? ''));
  const formRef = useRef<HTMLFormElement>(null);

  const uploadControl = useUploadFiles({
    route: 'thumbnails',
    api: '/api/admin/tools/thumbnails/upload',
    onUploadComplete: ({ files }) => {
      if (files.length > 0) {
        const file = files[0];
        const s3BaseUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_URL || '';
        const imageUrl = s3BaseUrl ? `${s3BaseUrl}/${file.objectInfo.key}` : file.objectInfo.key;
        setThumbnailUrl(imageUrl);
      }
    },
  });

  // Sync thumbnail URL when tool prop changes (e.g., after save)
  useEffect(() => {
    setThumbnailUrl(getS3PublicUrl(tool?.thumbnail ?? ''));
  }, [tool?.thumbnail]);

  // Redirect after successful creation
  useEffect(() => {
    if (state.success && isCreateMode && state.toolId) {
      router.push(`/dashboard/tools/${state.toolId}`);
    }
  }, [state.success, state.toolId, isCreateMode, router]);

  const handleSubmit = (formData: FormData) => {
    formData.set('thumbnail', thumbnailUrl);
    action(formData);
  };

  return (
    <form ref={formRef} action={handleSubmit}>
      {tool && <input type="hidden" name="id" value={tool.id} />}

      <div className="mx-auto max-w-4xl grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Core tool details and identification</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="slug">
                Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={tool?.slug ?? ''}
                placeholder="e.g., my-tool-name"
                aria-invalid={!!state.errors?.slug}
              />
              {state.errors?.slug && (
                <p className="text-destructive text-xs">{state.errors.slug[0]}</p>
              )}
              <p className="text-muted-foreground text-xs">
                URL-friendly identifier. Only lowercase letters, numbers, and hyphens.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                defaultValue={tool?.title ?? ''}
                placeholder="e.g., My Tool"
                aria-invalid={!!state.errors?.title}
              />
              {state.errors?.title && (
                <p className="text-destructive text-xs">{state.errors.title[0]}</p>
              )}
              <p className="text-muted-foreground text-xs">
                Display name for the tool
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="shortDescription">
                Short Description <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="shortDescription"
                name="shortDescription"
                defaultValue={tool?.shortDescription ?? ''}
                placeholder="e.g., A brief description..."
                maxLength={100}
                aria-invalid={!!state.errors?.shortDescription}
              />
              {state.errors?.shortDescription && (
                <p className="text-destructive text-xs">{state.errors.shortDescription[0]}</p>
              )}
              <p className="text-muted-foreground text-xs">
                Brief tagline shown in listings (max 100 chars)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">
                Full Description <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={tool?.description ?? ''}
                placeholder="e.g., Detailed description..."
                rows={4}
              />
              <p className="text-muted-foreground text-xs">
                Detailed description shown on tool page
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="toolTypeId">
                Tool Type <span className="text-destructive">*</span>
              </Label>
              <Select name="toolTypeId" defaultValue={tool?.toolTypeId}>
                <SelectTrigger aria-invalid={!!state.errors?.toolTypeId}>
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
              {state.errors?.toolTypeId && (
                <p className="text-destructive text-xs">{state.errors.toolTypeId[0]}</p>
              )}
              <p className="text-muted-foreground text-xs">
                Category for organizing the tool
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
                  imageUrl={thumbnailUrl}
                  ratioType="THUMBNAIL"
                  onRemove={() => setThumbnailUrl('')}
                />
              ) : (
                <UploadDropzone
                  control={uploadControl}
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

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Control tool visibility and promotion</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">
                  Active <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <p className="text-sm text-muted-foreground">Tool is visible to users</p>
              </div>
              <Switch
                id="isActive"
                name="isActive"
                defaultChecked={tool?.isActive ?? false}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isFeatured">
                  Featured <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <p className="text-sm text-muted-foreground">Highlight on homepage</p>
              </div>
              <Switch
                id="isFeatured"
                name="isFeatured"
                defaultChecked={tool?.isFeatured ?? false}
              />
            </div>
          </CardContent>
        </Card>

        {state.message && !state.success && !state.errors && (
          <p className="text-destructive">{state.message}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/tools')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (isCreateMode ? 'Creating...' : 'Saving...') : (isCreateMode ? 'Create Tool' : 'Save Changes')}
          </Button>
        </div>
      </div>
    </form>
  );
}
