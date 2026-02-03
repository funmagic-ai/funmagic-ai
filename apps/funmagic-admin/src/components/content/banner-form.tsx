'use client';

import { useState, useTransition } from 'react';
import { useUploadFiles } from '@better-upload/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UploadDropzone } from '@/components/ui/upload-dropzone';
import { AspectRatioPreview } from '@/components/ui/aspect-ratio-preview';
import { Plus, Pencil } from 'lucide-react';
import { createBanner, updateBanner } from '@/actions/banners';
import { cn } from '@/lib/utils';
import { IMAGE_RATIOS, RECOMMENDED_DIMENSIONS } from '@/lib/image-ratio';

interface BannerFormProps {
  mode: 'create' | 'edit';
  className?: string;
  banner?: {
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
    badgeColor: string | null;
    isActive: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
  };
}

export function BannerForm({ mode, className, banner }: BannerFormProps) {
  const [open, setOpen] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(banner?.thumbnail ?? '');
  const [bannerType, setBannerType] = useState(banner?.type ?? 'main');
  const [isPending, startTransition] = useTransition();

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('thumbnail', thumbnailUrl);

    startTransition(async () => {
      if (mode === 'create') {
        await createBanner(formData);
      } else if (banner) {
        await updateBanner(banner.id, formData);
      }
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          <Button size="sm" className={cn(className)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Banner
          </Button>
        ) : (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Create Banner' : 'Edit Banner'}</DialogTitle>
            <DialogDescription>
              {mode === 'create' ? 'Add a new promotional banner' : 'Update banner details'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                defaultValue={banner?.title}
                placeholder="New Feature Available!"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={banner?.description ?? ''}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="link">Link URL</Label>
                <Input
                  id="link"
                  name="link"
                  defaultValue={banner?.link ?? ''}
                  placeholder="https://..."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="linkText">Link Text</Label>
                <Input
                  id="linkText"
                  name="linkText"
                  defaultValue={banner?.linkText ?? ''}
                  placeholder="Learn More"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  name="type"
                  defaultValue={banner?.type ?? 'main'}
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
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  name="position"
                  type="number"
                  min="0"
                  defaultValue={banner?.position ?? 0}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="badge">Badge Text</Label>
                <Input
                  id="badge"
                  name="badge"
                  defaultValue={banner?.badge ?? ''}
                  placeholder="NEW"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="badgeColor">Badge Color</Label>
                <Input
                  id="badgeColor"
                  name="badgeColor"
                  type="color"
                  defaultValue={banner?.badgeColor ?? '#ef4444'}
                  className="h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startsAt">Starts At</Label>
                <Input
                  id="startsAt"
                  name="startsAt"
                  type="datetime-local"
                  defaultValue={
                    banner?.startsAt
                      ? new Date(banner.startsAt).toISOString().slice(0, 16)
                      : ''
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endsAt">Ends At</Label>
                <Input
                  id="endsAt"
                  name="endsAt"
                  type="datetime-local"
                  defaultValue={
                    banner?.endsAt ? new Date(banner.endsAt).toISOString().slice(0, 16) : ''
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">Active</Label>
                <p className="text-sm text-muted-foreground">Show this banner</p>
              </div>
              <Switch
                id="isActive"
                name="isActive"
                defaultChecked={banner?.isActive ?? true}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !thumbnailUrl}>
              {isPending ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
