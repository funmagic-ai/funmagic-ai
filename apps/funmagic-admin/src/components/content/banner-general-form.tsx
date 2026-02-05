'use client';

import { startTransition, useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useUploadFiles } from '@better-upload/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { createBanner } from '@/actions/banners';
import { IMAGE_RATIOS, RECOMMENDED_DIMENSIONS } from '@/lib/image-ratio';
import type { FormState } from '@/lib/form-types';
import type { BannerTranslations } from '@funmagic/shared';

const BANNER_TRANSLATION_FIELDS = [
  {
    name: 'title',
    label: 'Title',
    required: true,
    rows: 1,
    placeholder: 'e.g., New Feature Available!',
  },
  {
    name: 'description',
    label: 'Description',
    rows: 2,
    placeholder: 'e.g., Check out our latest features...',
  },
  {
    name: 'linkText',
    label: 'Link Text',
    rows: 1,
    placeholder: 'e.g., Learn More',
  },
  {
    name: 'badge',
    label: 'Badge Text',
    rows: 1,
    maxLength: 20,
    placeholder: 'e.g., NEW',
  },
];

export function BannerGeneralForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [bannerType, setBannerType] = useState('main');
  const [isUploading, setIsUploading] = useState(false);
  const [translations, setTranslations] = useState<BannerTranslations>({
    en: {
      title: '',
      description: '',
      linkText: '',
      badge: '',
    },
  });

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
      const result = await createBanner(prevState, formData);

      if (result.success) {
        toast.success(result.message || 'Banner created successfully');
        await new Promise(resolve => setTimeout(resolve, 1500));
        router.push('/dashboard/content');
      }

      return result;
    },
    { success: false, message: '', errors: {} as Record<string, string[]> }
  );

  const handleSubmit = async (formData: FormData) => {
    if (!file) return;

    try {
      setIsUploading(true);
      // Upload file to S3 first
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
    startTransition(() => {
      formAction(formData);
    });
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
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
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., New Feature Available!"
                value={translations.en?.title ?? ''}
                onChange={(e) => {
                  setTranslations((prev) => ({
                    ...prev,
                    en: { ...prev.en, title: e.target.value },
                  }));
                }}
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
                placeholder="e.g., Check out our latest features..."
                rows={2}
                value={translations.en?.description ?? ''}
                onChange={(e) => {
                  setTranslations((prev) => ({
                    ...prev,
                    en: { ...prev.en, description: e.target.value },
                  }));
                }}
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
              {previewUrl ? (
                <AspectRatioPreview
                  imageUrl={previewUrl}
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
                <Label htmlFor="linkText">Link Text</Label>
                <Input
                  id="linkText"
                  name="linkText"
                  placeholder="e.g., Learn More"
                  value={translations.en?.linkText ?? ''}
                  onChange={(e) => {
                    setTranslations((prev) => ({
                      ...prev,
                      en: { ...prev.en, linkText: e.target.value },
                    }));
                  }}
                />
                <p className="text-muted-foreground text-xs">
                  Call-to-action button text
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="linkTarget">Link Target</Label>
              <Select name="linkTarget" defaultValue="_self">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_self">Same Window (_self)</SelectItem>
                  <SelectItem value="_blank">New Tab (_blank)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                How the link opens when clicked
              </p>
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
                <Label htmlFor="type">
                  Type <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
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
                <p className="text-muted-foreground text-xs">
                  Main banners are larger; side banners appear in secondary areas
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="badge">
                  Badge Text <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="badge"
                  name="badge"
                  placeholder="e.g., NEW"
                  maxLength={20}
                  value={translations.en?.badge ?? ''}
                  onChange={(e) => {
                    setTranslations((prev) => ({
                      ...prev,
                      en: { ...prev.en, badge: e.target.value },
                    }));
                  }}
                  aria-invalid={!!state.errors?.badge}
                />
                {state.errors?.badge && (
                  <p className="text-destructive text-xs">{state.errors.badge[0]}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  Short label shown on the banner (max 20 chars)
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
                />
                <p className="text-muted-foreground text-xs">
                  When the banner is automatically hidden
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Translations Editor */}
        <TranslationsEditor
          translations={translations}
          onChange={setTranslations}
          fields={BANNER_TRANSLATION_FIELDS}
          title="Localized Content"
          description="Translate banner content for each language"
        />
        <input type="hidden" name="translations" value={JSON.stringify(translations)} />

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
          <Button type="submit" disabled={isPending || isUploading || !file}>
            {isUploading ? 'Uploading...' : isPending ? 'Creating...' : 'Create Banner'}
          </Button>
        </div>
      </div>
    </form>
  );
}
