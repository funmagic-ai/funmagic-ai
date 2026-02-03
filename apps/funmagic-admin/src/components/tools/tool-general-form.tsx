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

  const [state, action, isPending] = useActionState(serverAction, {
    success: false,
    message: '',
  });
  const [thumbnailUrl, setThumbnailUrl] = useState(tool?.thumbnail ?? '');
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
    setThumbnailUrl(tool?.thumbnail ?? '');
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
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={tool?.slug ?? ''}
                placeholder="my-tool"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                defaultValue={tool?.title ?? ''}
                placeholder="My Tool"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input
                id="shortDescription"
                name="shortDescription"
                defaultValue={tool?.shortDescription ?? ''}
                placeholder="A brief description..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Full Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={tool?.description ?? ''}
                placeholder="Detailed description..."
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="toolTypeId">Tool Type</Label>
              <Select name="toolTypeId" defaultValue={tool?.toolTypeId}>
                <SelectTrigger>
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
            </div>

            <div className="grid gap-2">
              <Label>Thumbnail</Label>
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
                <Label htmlFor="isActive">Active</Label>
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
                <Label htmlFor="isFeatured">Featured</Label>
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

        {state.message && (
          <p className={state.success ? 'text-green-600' : 'text-destructive'}>
            {state.message}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? (isCreateMode ? 'Creating...' : 'Saving...') : (isCreateMode ? 'Create Tool' : 'Save Changes')}
          </Button>
        </div>
      </div>
    </form>
  );
}
