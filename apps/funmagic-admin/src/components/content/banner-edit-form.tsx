'use client';

import { startTransition, useActionState, useEffect, useState } from 'react';
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
import { updateBanner } from '@/actions/banners';
import { IMAGE_RATIOS, RECOMMENDED_DIMENSIONS } from '@/lib/image-ratio';
import { getS3PublicUrl } from '@/lib/s3-url';
import type { FormState } from '@/lib/form-types';

interface Banner {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string;
  link: string | null;
  linkText: string | null;
  linkTarget: string | null;
  type: string;
  position: number | null;
  badge: string | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

interface BannerEditFormProps {
  banner: Banner;
}

export function BannerEditForm({ banner }: BannerEditFormProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [existingUrl, setExistingUrl] = useState(getS3PublicUrl(banner.thumbnail));
  const [bannerType, setBannerType] = useState(banner.type);
  const [isUploading, setIsUploading] = useState(false);

  // Create local preview URL when file is selected
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl('');
  }, [file]);

  // Upload hook for deferred upload on submit
  const { upload: uploadToS3 } = useUploadFiles({
    route: 'banners',
    api: '/api/admin/content/banners/upload',
  });

  const [state, formAction, isPending] = useActionState(
    async (prevState: FormState, formData: FormData) => {
      const result = await updateBanner(prevState, formData);

      if (result.success) {
        toast.success(result.message || 'Banner updated successfully');
        await new Promise(resolve => setTimeout(resolve, 1500));
        router.push('/dashboard/content');
      }

      return result;
    },
    { success: false, message: '', errors: {} as Record<string, string[]> }
  );

  // The display URL: prefer local preview, fall back to existing URL
  const displayUrl = previewUrl || existingUrl;

  const handleSubmit = async (formData: FormData) => {
    // If a new file was selected, upload it first
    if (file) {
      try {
        setIsUploading(true);
        const uploadResult = await uploadToS3([file]);
        if (uploadResult.files.length > 0) {
          const uploadedFile = uploadResult.files[0];
          const s3BaseUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_URL || '';
          const imageUrl = s3BaseUrl
            ? `${s3BaseUrl}/${uploadedFile.objectInfo.key}`
            : uploadedFile.objectInfo.key;
          formData.set('thumbnail', imageUrl);
        }
      } catch {
        toast.error('Failed to upload image');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    } else if (existingUrl) {
      // Keep existing URL if no new file selected
      formData.set('thumbnail', existingUrl);
    }

    startTransition(() => {
      formAction(formData);
    });
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setExistingUrl(''); // Clear existing URL when new file is selected
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewUrl('');
    setExistingUrl('');
  };

  return (
    <form action={handleSubmit}>
      <input type="hidden" name="id" value={banner.id} />
      <div className="mx-auto max-w-4xl grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Banner content and display settings</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                defaultValue={banner.title}
                placeholder="e.g., New Feature Available!"
                aria-invalid={!!state.errors?.title}
              />
              {state.errors?.title && (
                <p className="text-destructive text-xs">{state.errors.title[0]}</p>
              )}
              <p className="text-muted-foreground text-xs">
                Display title for the banner
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">
                Description <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={banner.description ?? ''}
                placeholder="e.g., Check out our latest features..."
                rows={2}
              />
              <p className="text-muted-foreground text-xs">
                Brief description shown on the banner
              </p>
            </div>

            <div className="grid gap-2">
              <Label>
                Banner Image <span className="text-destructive">*</span>
              </Label>
              <p className="text-muted-foreground text-xs">
                Recommended: {RECOMMENDED_DIMENSIONS.BANNER.width}×{RECOMMENDED_DIMENSIONS.BANNER.height}px or larger ({IMAGE_RATIOS.BANNER.label})
              </p>
              {displayUrl ? (
                <AspectRatioPreview
                  imageUrl={displayUrl}
                  ratioType="BANNER"
                  onRemove={handleRemoveFile}
                  showSideBannerNote={bannerType === 'side'}
                />
              ) : (
                <UploadDropzone
                  onFileSelect={handleFileSelect}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  description={{
                    fileTypes: 'JPEG, PNG, WebP, GIF',
                    maxFileSize: '10MB',
                    maxFiles: 1,
                  }}
                />
              )}
              {state.errors?.thumbnail && (
                <p className="text-destructive text-xs">{state.errors.thumbnail[0]}</p>
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
                <Label htmlFor="link">
                  Link URL <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="link"
                  name="link"
                  defaultValue={banner.link ?? ''}
                  placeholder="e.g., https://example.com/promo"
                  aria-invalid={!!state.errors?.link}
                />
                {state.errors?.link && (
                  <p className="text-destructive text-xs">{state.errors.link[0]}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  Where users go when clicking the banner
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="linkText">
                  Link Text <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="linkText"
                  name="linkText"
                  defaultValue={banner.linkText ?? ''}
                  placeholder="e.g., Learn More"
                />
                <p className="text-muted-foreground text-xs">
                  Call-to-action button text
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Display Settings</CardTitle>
            <CardDescription>Type, position, and badge configuration</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">
                  Type <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Select
                  name="type"
                  defaultValue={banner.type}
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
                <p className="text-muted-foreground text-xs">
                  Main or side banner placement
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="position">
                  Position <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="position"
                  name="position"
                  type="number"
                  min="0"
                  defaultValue={banner.position ?? 0}
                />
                <p className="text-muted-foreground text-xs">
                  Lower numbers appear first
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="badge">
                  Badge Text <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="badge"
                  name="badge"
                  defaultValue={banner.badge ?? ''}
                  placeholder="e.g., NEW"
                  maxLength={20}
                  aria-invalid={!!state.errors?.badge}
                />
                {state.errors?.badge && (
                  <p className="text-destructive text-xs">{state.errors.badge[0]}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  Short label (max 20 chars)
                </p>
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
                <Label htmlFor="startsAt">
                  Starts At <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="startsAt"
                  name="startsAt"
                  type="datetime-local"
                  defaultValue={
                    banner.startsAt
                      ? new Date(banner.startsAt).toISOString().slice(0, 16)
                      : ''
                  }
                />
                <p className="text-muted-foreground text-xs">
                  When the banner becomes visible
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endsAt">
                  Ends At <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="endsAt"
                  name="endsAt"
                  type="datetime-local"
                  defaultValue={
                    banner.endsAt
                      ? new Date(banner.endsAt).toISOString().slice(0, 16)
                      : ''
                  }
                />
                <p className="text-muted-foreground text-xs">
                  When the banner is automatically hidden
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">
                  Active <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <p className="text-sm text-muted-foreground">Show this banner</p>
              </div>
              <Switch id="isActive" name="isActive" defaultChecked={banner.isActive} />
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
            onClick={() => router.push('/dashboard/content')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || isUploading || !displayUrl}>
            {isUploading ? 'Uploading...' : isPending ? 'Saving...' : 'Update Banner'}
          </Button>
        </div>
      </div>
    </form>
  );
}
