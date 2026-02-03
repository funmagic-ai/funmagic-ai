'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
import { createBanner } from '@/actions/banners';
import { IMAGE_RATIOS, RECOMMENDED_DIMENSIONS } from '@/lib/image-ratio';

export function BannerGeneralForm() {
  const router = useRouter();
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [bannerType, setBannerType] = useState('main');

  const [state, formAction, isPending] = useActionState(
    async (prevState: { success: boolean; message: string }, formData: FormData) => {
      const result = await createBanner(prevState, formData);

      if (result.success) {
        toast.success(result.message || 'Banner created successfully');
        await new Promise(resolve => setTimeout(resolve, 1500));
        router.push('/dashboard/content');
      }

      return result;
    },
    { success: false, message: '' }
  );

  const uploadControl = useUploadFiles({
    route: 'banners',
    api: '/api/admin/content/banners/upload',
    onUploadComplete: ({ files }) => {
      if (files.length > 0) {
        const file = files[0];
        const s3BaseUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_URL || '';
        const imageUrl = s3BaseUrl ? `${s3BaseUrl}/${file.objectInfo.key}` : file.objectInfo.key;
        setThumbnailUrl(imageUrl);
      }
    },
  });

  const handleSubmit = (formData: FormData) => {
    formData.set('thumbnail', thumbnailUrl);
    formAction(formData);
  };

  return (
    <form action={handleSubmit}>
      <div className="mx-auto max-w-4xl grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Banner content and display settings</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="New Feature Available!"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Check out our latest features..."
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label>Banner Image</Label>
              <p className="text-muted-foreground text-xs">
                Recommended: {RECOMMENDED_DIMENSIONS.BANNER.width}×{RECOMMENDED_DIMENSIONS.BANNER.height}px or larger ({IMAGE_RATIOS.BANNER.label})
              </p>
              {thumbnailUrl ? (
                <AspectRatioPreview
                  imageUrl={thumbnailUrl}
                  ratioType="BANNER"
                  onRemove={() => setThumbnailUrl('')}
                  showSideBannerNote={bannerType === 'side'}
                />
              ) : (
                <UploadDropzone
                  control={uploadControl}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  description={{
                    fileTypes: 'JPEG, PNG, WebP, GIF',
                    maxFileSize: '10MB',
                    maxFiles: 1,
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Link Settings</CardTitle>
            <CardDescription>Configure banner click behavior</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="link">Link URL</Label>
                <Input
                  id="link"
                  name="link"
                  placeholder="https://..."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="linkText">Link Text</Label>
                <Input
                  id="linkText"
                  name="linkText"
                  placeholder="Learn More"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Display Settings</CardTitle>
            <CardDescription>Type and badge configuration</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  name="type"
                  defaultValue="main"
                  onValueChange={setBannerType}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main</SelectItem>
                    <SelectItem value="side">Side</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="badge">Badge Text</Label>
                <Input
                  id="badge"
                  name="badge"
                  placeholder="NEW"
                  maxLength={20}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>Control when the banner is displayed</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startsAt">Starts At</Label>
                <Input
                  id="startsAt"
                  name="startsAt"
                  type="datetime-local"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endsAt">Ends At</Label>
                <Input
                  id="endsAt"
                  name="endsAt"
                  type="datetime-local"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">Active</Label>
                <p className="text-sm text-muted-foreground">Show this banner</p>
              </div>
              <Switch id="isActive" name="isActive" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {state.message && !state.success && (
          <p className="text-destructive">{state.message}</p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending || !thumbnailUrl}>
            {isPending ? 'Creating...' : 'Create Banner'}
          </Button>
        </div>
      </div>
    </form>
  );
}
